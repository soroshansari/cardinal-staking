use crate::utils::resize_account;

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
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RemoveFromGroupEntryCtx>) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let stake_entry = &mut ctx.accounts.stake_entry;

    if stake_entry.grouped != Some(true) {
        return Err(error!(ErrorCode::UngroupedStakeEntry));
    }

    if group_entry.min_group_seconds.is_some() && (Clock::get().unwrap().unix_timestamp - group_entry.changed_at) < (group_entry.min_group_seconds.unwrap()) as i64 {
        return Err(error!(ErrorCode::MinGroupDaysNotSatisfied));
    }

    stake_entry.grouped = Some(false);

    let mut stake_entries = group_entry.stake_entries.clone();
    if let Some(index) = group_entry.stake_entries.iter().position(|value| *value == stake_entry.key()) {
        stake_entries.remove(index);
    } else {
        return Err(error!(ErrorCode::StakeEntryNotFoundInGroup));
    }
    let new_group_entry = GroupStakeEntry {
        bump: group_entry.bump,
        group_id: group_entry.group_id,
        authority: group_entry.authority,
        stake_entries: stake_entries.to_vec(),
        changed_at: Clock::get().unwrap().unix_timestamp,
        min_group_seconds: group_entry.min_group_seconds,
    };
    let new_space = new_group_entry.try_to_vec()?.len() + 8;
    group_entry.set_inner(new_group_entry);

    resize_account(
        &group_entry.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
