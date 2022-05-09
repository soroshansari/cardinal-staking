use {crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct UpdateStakedEntriesCounterCtx<'info> {
    #[account(mut)]
    // removed check on payer being pool authority temporarily to run script
    stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    payer: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateStakedEntriesCounterCtx>, counter: u64) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.staked_entries_counter = counter;

    Ok(())
}
