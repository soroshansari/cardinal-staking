use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, Token, TokenAccount},
    cardinal_token_manager::{
        self,
        program::CardinalTokenManager,
        state::{InvalidationType, TokenManagerKind},
    },
};

#[derive(Accounts)]
pub struct StakeCtx<'info> {
    #[account(mut)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(constraint = original_mint.key() == stake_entry.original_mint @ ErrorCode::InvalidOriginalMint)]
    original_mint: Box<Account<'info, Mint>>,

    // stake_entry token accounts
    #[account(mut, constraint =
        stake_entry_original_mint_token_account.amount == 0
        && stake_entry_original_mint_token_account.mint == stake_entry.original_mint
        && stake_entry_original_mint_token_account.owner == stake_entry.key()
        @ ErrorCode::InvalidStakeEntryOriginalMintTokenAccount)]
    stake_entry_original_mint_token_account: Box<Account<'info, TokenAccount>>,

    // user
    #[account(mut)]
    user: Signer<'info>,
    #[account(mut, constraint =
        user_original_mint_token_account.amount > 0
        && user_original_mint_token_account.mint == original_mint.key()
        && user_original_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserOriginalMintTokenAccount)]
    user_original_mint_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    token_manager_mint_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    token_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_counter: UncheckedAccount<'info>,

    // programs
    token_program: Program<'info, Token>,
    token_manager_program: Program<'info, CardinalTokenManager>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeCtx<'info>>, stake_type: u8) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;

    match stake_type {
        k if k == StakeType::Locked as u8 => {
            let stake_entry_seed = &[STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.original_mint.as_ref(), &[stake_entry.bump]];
            let stake_entry_signer = &[&stake_entry_seed[..]];

            // token manager init
            let cpi_accounts = cardinal_token_manager::cpi::accounts::InitCtx {
                token_manager: ctx.accounts.token_manager.to_account_info(),
                mint_counter: ctx.accounts.mint_counter.to_account_info(),
                issuer: stake_entry.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                issuer_token_account: ctx.accounts.stake_entry_original_mint_token_account.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
            cardinal_token_manager::cpi::init(cpi_ctx, ctx.accounts.original_mint.key(), 1)?;

            // add invalidator
            let cpi_accounts = cardinal_token_manager::cpi::accounts::AddInvalidatorCtx {
                token_manager: ctx.accounts.token_manager.to_account_info(),
                issuer: stake_entry.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
            cardinal_token_manager::cpi::add_invalidator(cpi_ctx, stake_entry.key())?;

            // token manager issue
            let cpi_accounts = cardinal_token_manager::cpi::accounts::IssueCtx {
                token_manager: ctx.accounts.token_manager.to_account_info(),
                token_manager_token_account: ctx.accounts.token_manager_mint_account.to_account_info(),
                issuer: stake_entry.to_account_info(),
                issuer_token_account: ctx.accounts.stake_entry_original_mint_token_account.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            };
            let issue_ix = cardinal_token_manager::instructions::IssueIx {
                amount: 1,
                kind: TokenManagerKind::Managed as u8,
                invalidation_type: InvalidationType::Return as u8,
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
            cardinal_token_manager::cpi::issue(cpi_ctx, issue_ix)?;

            // token manager claim
            let cpi_accounts = cardinal_token_manager::cpi::accounts::ClaimCtx {
                token_manager: ctx.accounts.token_manager.to_account_info(),
                token_manager_token_account: ctx.accounts.token_manager_mint_account.to_account_info(),
                mint: ctx.accounts.original_mint.to_account_info(),
                recipient: ctx.accounts.user.to_account_info(),
                recipient_token_account: ctx.accounts.user_original_mint_token_account.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            };
            let remaining_accounts = ctx.remaining_accounts.to_vec();
            let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_remaining_accounts(remaining_accounts);
            cardinal_token_manager::cpi::claim(cpi_ctx)?;

            // // set account delegate of recipient token account to token manager PDA
            // let cpi_accounts = Approve {
            //     to: ctx.accounts.recipient_token_account.to_account_info(),
            //     delegate: token_manager.to_account_info(),
            //     authority: ctx.accounts.recipient.to_account_info(),
            // };
            // let cpi_program = ctx.accounts.token_program.to_account_info();
            // let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            // token::approve(cpi_context, token_manager.amount)?;

            // invoke_signed(
            //     &freeze_delegated_account(
            //         *metadata_program.key,
            //         token_manager.key(),
            //         ctx.accounts.recipient_token_account.key(),
            //         *edition_info.key,
            //         ctx.accounts.mint.key(),
            //     ),
            //     &[
            //         token_manager.to_account_info(),
            //         ctx.accounts.recipient_token_account.to_account_info(),
            //         edition_info.to_account_info(),
            //         ctx.accounts.mint.to_account_info(),
            //     ],
            //     &[token_manager_seeds],
            // )?;
        }
        k if k == StakeType::Escrow as u8 => {
            // transfer original
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.user_original_mint_token_account.to_account_info(),
                to: ctx.accounts.stake_entry_original_mint_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_context, 1)?;
        }
        _ => return Err(error!(ErrorCode::InvalidStakeType)),
    }

    // update stake entry
    stake_entry.last_staked_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.last_staker = Some(ctx.accounts.user.key());
    Ok(())
}