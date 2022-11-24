use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseGroupEntryCtx<'info> {
    #[account(mut, close = authority, has_one = authority)]
    group_entry: Box<Account<'info, GroupStakeEntry>>,

    #[account(mut)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<CloseGroupEntryCtx>) -> Result<()> {
    let group_entry = &ctx.accounts.group_entry;

    if group_entry.stake_entries.len() != 0 {
        return Err(error!(ErrorCode::ActiveGroupEntry));
    }

    Ok(())
}
