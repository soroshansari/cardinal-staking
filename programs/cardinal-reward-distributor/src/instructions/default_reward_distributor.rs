use {crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct DefaultRewardDistributorCtx<'info> {
    #[account(mut)]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
}

pub fn handler(ctx: Context<DefaultRewardDistributorCtx>) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.default_multiplier = 1;
    reward_distributor.multiplier_decimals = 0;
    Ok(())
}
