use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRewardDistributorIx {
    pub default_multiplier: u64,
    pub multiplier_decimals: u8,
}

#[derive(Accounts)]
#[instruction(ix: UpdateRewardDistributorIx)]
pub struct UpdateRewardDistributorCtx<'info> {
    #[account(mut)]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(constraint = authority.key() == reward_distributor.authority @ ErrorCode::InvalidRewardDistributorAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateRewardDistributorCtx>, ix: UpdateRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.default_multiplier = ix.default_multiplier;
    reward_distributor.multiplier_decimals = ix.multiplier_decimals;
    Ok(())
}
