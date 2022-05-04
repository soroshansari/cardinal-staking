use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseStakeEntryCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, close = authority, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseStakeEntryCtx>) -> Result<()> {
    Ok(())
}
