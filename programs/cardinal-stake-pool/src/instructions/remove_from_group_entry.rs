use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct RemoveFromGroupEntryCtx<'info> {
    #[account(mut, has_one = authority)]
    group_entry: Box<Account<'info, GroupStakeEntry>>,

    #[account(mut, constraint = stake_entry.last_staker == authority.key() @ ErrorCode::InvalidAuthority)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RemoveFromGroupEntryCtx>) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let stake_entry = &mut ctx.accounts.stake_entry;

    if stake_entry.grouped != Some(true) {
        return Err(error!(ErrorCode::UngroupedStakeEntry));
    }

    if group_entry.min_group_days.is_some() && (Clock::get().unwrap().unix_timestamp - group_entry.started_at) < (group_entry.min_group_days.unwrap() * 24 * 60 * 60) as i64 {
        return Err(error!(ErrorCode::MinGroupDaysNotSatisfied));
    }

    if let Some(index) = group_entry.stake_entries.iter().position(|value| *value == stake_entry.key()) {
        group_entry.stake_entries.swap_remove(index);
    }

    stake_entry.grouped = Some(false);

    Ok(())
}
