use crate::utils::resize_account;

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
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddToGroupEntryCtx>) -> Result<()> {
    let group_entry = &mut ctx.accounts.group_entry;
    let stake_entry = &mut ctx.accounts.stake_entry;

    if stake_entry.grouped == Some(true) {
        return Err(error!(ErrorCode::GroupedStakeEntry));
    }
    stake_entry.grouped = Some(true);

    let mut stake_entries = group_entry.stake_entries.clone();
    stake_entries.push(stake_entry.key());

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
