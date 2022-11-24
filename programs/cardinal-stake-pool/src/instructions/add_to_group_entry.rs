use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct AddToGroupEntryCtx<'info> {
    #[account(mut, has_one = authority)]
    group_entry: Box<Account<'info, GroupStakeEntry>>,

    #[account(mut, constraint = stake_entry.last_staker == authority.key() @ ErrorCode::InvalidAuthority)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddToGroupEntryCtx>) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let stake_entry = &mut ctx.accounts.stake_entry;
    group_entry.changed_at = Clock::get().unwrap().unix_timestamp;
    group_entry.stake_entries.push(stake_entry.key());

    if stake_entry.grouped == Some(true) {
        return Err(error!(ErrorCode::GroupedStakeEntry));
    }

    stake_entry.grouped = Some(true);

    Ok(())
}
