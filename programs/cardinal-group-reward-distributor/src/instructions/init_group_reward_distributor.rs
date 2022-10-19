use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, SetAuthority, Token, TokenAccount},
    spl_token::instruction::AuthorityType,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitGroupRewardDistributorIx {
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub reward_kind: u8,
    pub metadata_kind: u8,
    pub pool_kind: u8,
    pub authorized_pools: Vec<Pubkey>,
    pub supply: Option<u64>,
    pub max_supply: Option<u64>,
    pub default_multiplier: Option<u64>,
    pub multiplier_decimals: Option<u8>,
    pub max_reward_seconds_received: Option<u128>,
    pub group_days_multiplier: Option<u64>,
    pub group_days_multiplier_decimals: Option<u8>,
    pub group_count_multiplier: Option<u64>,
    pub group_count_multiplier_decimals: Option<u8>,
    pub min_group_size: Option<u8>,
}

#[derive(Accounts)]
pub struct InitGroupRewardDistributorCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = GROUP_REWARD_DISTRIBUTOR_SIZE,
        seeds = [GROUP_REWARD_DISTRIBUTOR_SEED.as_bytes(), id.key().as_ref()],
        bump,
    )]
    group_reward_distributor: Box<Account<'info, GroupRewardDistributor>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    id: AccountInfo<'info>,

    #[account(mut)]
    reward_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    authority: Signer<'info>,

    #[account(mut)]
    payer: Signer<'info>,

    token_program: Program<'info, Token>,

    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InitGroupRewardDistributorCtx<'info>>, ix: InitGroupRewardDistributorIx) -> Result<()> {
    let group_reward_distributor = &mut ctx.accounts.group_reward_distributor;
    group_reward_distributor.bump = *ctx.bumps.get("group_reward_distributor").unwrap();
    group_reward_distributor.id = ctx.accounts.id.key();
    group_reward_distributor.reward_kind = ix.reward_kind;
    group_reward_distributor.metadata_kind = ix.metadata_kind;
    group_reward_distributor.pool_kind = ix.pool_kind;
    group_reward_distributor.authorized_pools = ix.authorized_pools;
    group_reward_distributor.authority = ctx.accounts.authority.key();
    group_reward_distributor.reward_mint = ctx.accounts.reward_mint.key();
    group_reward_distributor.reward_amount = ix.reward_amount;
    group_reward_distributor.reward_duration_seconds = ix.reward_duration_seconds as u128;
    group_reward_distributor.max_supply = ix.max_supply;
    group_reward_distributor.default_multiplier = ix.default_multiplier.unwrap_or(1);
    group_reward_distributor.multiplier_decimals = ix.multiplier_decimals.unwrap_or(0);
    group_reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    group_reward_distributor.group_days_multiplier = ix.group_days_multiplier.unwrap_or(1);
    group_reward_distributor.group_days_multiplier_decimals = ix.group_days_multiplier_decimals.unwrap_or(0);
    group_reward_distributor.group_count_multiplier = ix.group_count_multiplier;
    group_reward_distributor.group_count_multiplier_decimals = ix.group_count_multiplier_decimals;
    group_reward_distributor.min_group_size = ix.min_group_size;

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    match ix.reward_kind {
        k if k == GroupRewardDistributorKind::Mint as u8 => {
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.reward_mint.to_account_info(),
                current_authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::set_authority(cpi_context, AuthorityType::MintTokens, Some(group_reward_distributor.key()))?;
        }
        k if k == GroupRewardDistributorKind::Treasury as u8 => {
            if ix.supply.is_none() && ix.max_supply.is_none() {
                return Err(error!(ErrorCode::SupplyRequired));
            }
            let group_reward_distributor_token_account_info = next_account_info(remaining_accs)?;
            let group_reward_distributor_token_account = Account::<TokenAccount>::try_from(group_reward_distributor_token_account_info)?;
            let authority_token_account_info = next_account_info(remaining_accs)?;
            let authority_token_account = Account::<TokenAccount>::try_from(authority_token_account_info)?;

            let cpi_accounts = token::Transfer {
                from: authority_token_account.to_account_info(),
                to: group_reward_distributor_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_context, ix.supply.unwrap_or_else(|| ix.max_supply.unwrap()))?;
        }
        _ => return Err(error!(ErrorCode::InvalidRewardDistributorKind)),
    }
    Ok(())
}
