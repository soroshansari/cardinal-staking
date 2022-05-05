use anchor_lang::AccountsClose;
// use anchor_lang::Discriminator;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_stake_pool::state::StakeEntry,
};

#[derive(Accounts)]
pub struct MigrateRewardEntryCtx<'info> {
    #[account(
        init,
        payer = migrator,
        space = REWARD_ENTRY_SIZE,
        seeds = [REWARD_ENTRY_SEED.as_bytes(), reward_distributor.key().as_ref(), stake_entry.key().as_ref()],
        bump,
    )]
    reward_entry: Box<Account<'info, RewardEntry>>,
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    reward_entry_v0: UncheckedAccount<'info>,
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut)]
    migrator: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MigrateRewardEntryCtx>) -> Result<()> {
    let reward_entry_v0_account_info = ctx.accounts.reward_entry_v0.to_account_info();
    // discriminator check
    // let data: &[u8] = &reward_entry_v0_account_info.try_borrow_data()?;
    // let disc_bytes = &data[..8];
    // if disc_bytes != RewardEntry::discriminator() && disc_bytes.iter().any(|a| a != &0) {
    //     return Err(error!(ErrorCode::InvalidRewardEntry));
    // }

    let reward_entry_v0 = Account::<RewardEntryV0>::try_from_unchecked(&reward_entry_v0_account_info)?;
    if reward_entry_v0.reward_distributor != ctx.accounts.reward_distributor.key() {
        return Err(error!(ErrorCode::InvalidRewardDistributor));
    }
    if reward_entry_v0.mint != ctx.accounts.stake_entry.original_mint {
        return Err(error!(ErrorCode::InvalidStakeEntry));
    }

    let reward_entry = &mut ctx.accounts.reward_entry;
    reward_entry.bump = *ctx.bumps.get("reward_entry").unwrap();
    reward_entry.reward_distributor = reward_entry_v0.reward_distributor;
    reward_entry.reward_seconds_received = reward_entry_v0.reward_seconds_received;
    reward_entry.stake_entry = ctx.accounts.stake_entry.key();
    reward_entry.multiplier = reward_entry_v0.multiplier;

    reward_entry_v0.close(ctx.accounts.migrator.to_account_info())?;
    reward_entry_v0.exit(ctx.program_id)?;
    Ok(())
}
