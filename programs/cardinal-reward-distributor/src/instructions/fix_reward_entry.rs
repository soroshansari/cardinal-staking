use {crate::state::*, anchor_lang::prelude::*, cardinal_stake_pool::state::StakeEntry};

#[derive(Accounts)]
pub struct FixRewardEntryCtx<'info> {
    #[account(mut, seeds = [REWARD_ENTRY_SEED.as_bytes(), reward_distributor.key().as_ref(), stake_entry.key().as_ref()], bump = reward_entry.bump)]
    reward_entry: Box<Account<'info, RewardEntry>>,
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(constraint = reward_distributor.stake_pool == stake_entry.pool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    migrator: Signer<'info>,
}

pub fn handler(ctx: Context<FixRewardEntryCtx>) -> Result<()> {
    let reward_entry = &mut ctx.accounts.reward_entry;
    reward_entry.stake_entry = ctx.accounts.stake_entry.key();
    Ok(())
}
