use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseStakePoolCtx<'info> {
    #[account(mut, close = authority)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseStakePoolCtx>) -> Result<()> {
    Ok(())
}
