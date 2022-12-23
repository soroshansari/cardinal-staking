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

    if group_entry.group_cooldown_seconds > 0 {
        if group_entry.group_cooldown_start_seconds.is_none() {
            group_entry.group_cooldown_start_seconds = Some(Clock::get().unwrap().unix_timestamp);
            return Ok(());
        } else if group_entry.group_cooldown_start_seconds.is_some()
            && ((Clock::get().unwrap().unix_timestamp - group_entry.group_cooldown_start_seconds.unwrap()) as u32) < group_entry.group_cooldown_seconds
        {
            return Err(error!(ErrorCode::CooldownSecondRemaining));
        }
    }

    if group_entry.group_stake_seconds > 0 && (Clock::get().unwrap().unix_timestamp - group_entry.changed_at) < group_entry.group_stake_seconds as i64 {
        return Err(error!(ErrorCode::MinGroupSecondsNotSatisfied));
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
        group_cooldown_seconds: group_entry.group_cooldown_seconds,
        group_stake_seconds: group_entry.group_stake_seconds,
        group_cooldown_start_seconds: group_entry.group_cooldown_start_seconds,
    };
    let new_space = new_group_entry.try_to_vec()?.len() + 8;
    resize_account(
        &group_entry.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    group_entry.set_inner(new_group_entry);
    Ok(())
}
