use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitGroupEntryIx {
    pub id: Pubkey,
    pub min_group_days: Option<u32>,
}

#[derive(Accounts)]
#[instruction(ix: InitGroupEntryIx)]
pub struct InitGroupEntryCtx<'info> {
    #[account(
        init,
        payer = authority,
        space = GROUP_ENTRY_SIZE,
        seeds = [GROUP_ENTRY_PREFIX.as_bytes(), ix.id.key().as_ref()],
        bump,
    )]
    group_entry: Box<Account<'info, GroupStakeEntry>>,
    #[account(mut, constraint = stake_entry.last_staker == authority.key() @ ErrorCode::InvalidAuthority)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitGroupEntryCtx>, ix: InitGroupEntryIx) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let stake_entry = &mut ctx.accounts.stake_entry;
    let authority = &mut ctx.accounts.authority;
    group_entry.bump = *ctx.bumps.get("group_entry").unwrap();
    group_entry.authority = authority.key();
    group_entry.started_at = Clock::get().unwrap().unix_timestamp;
    group_entry.min_group_days = ix.min_group_days;

    let mut stake_entries = Vec::new();
    stake_entries.push(stake_entry.key());
    group_entry.stake_entries = stake_entries;

    if stake_entry.grouped == Some(true) {
        return Err(error!(ErrorCode::GroupedStakeEntry));
    }

    stake_entry.grouped = Some(true);

    Ok(())
}