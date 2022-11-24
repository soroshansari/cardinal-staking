use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGroupRewardDistributorIx {
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub metadata_kind: u8,
    pub pool_kind: u8,
    pub authorized_pools: Vec<Pubkey>,
    pub max_supply: Option<u64>,
    pub default_multiplier: Option<u64>,
    pub multiplier_decimals: Option<u8>,
    pub max_reward_seconds_received: Option<u128>,
    pub group_duration_multiplier_seconds: Option<u128>,
    pub group_duration_multiplier: Option<u64>,
    pub group_duration_multiplier_decimals: Option<u8>,
    pub group_count_multiplier: Option<u64>,
    pub group_count_multiplier_decimals: Option<u8>,
    pub min_group_size: Option<u8>,
}

#[derive(Accounts)]
#[instruction(ix: UpdateGroupRewardDistributorIx)]
pub struct UpdateGroupRewardDistributorCtx<'info> {
    #[account(mut, has_one = authority)]
    group_reward_distributor: Box<Account<'info, GroupRewardDistributor>>,

    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateGroupRewardDistributorCtx>, ix: UpdateGroupRewardDistributorIx) -> Result<()> {
    let group_reward_distributor = &mut ctx.accounts.group_reward_distributor;
    group_reward_distributor.metadata_kind = GroupRewardDistributorMetadataKind::from(ix.metadata_kind);
    group_reward_distributor.pool_kind = GroupRewardDistributorPoolKind::from(ix.pool_kind);
    group_reward_distributor.authorized_pools = ix.authorized_pools;
    group_reward_distributor.reward_amount = ix.reward_amount;
    group_reward_distributor.reward_duration_seconds = ix.reward_duration_seconds as u128;
    group_reward_distributor.max_supply = ix.max_supply;
    group_reward_distributor.default_multiplier = ix.default_multiplier.unwrap_or(1);
    group_reward_distributor.multiplier_decimals = ix.multiplier_decimals.unwrap_or(0);
    group_reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    group_reward_distributor.group_duration_multiplier = ix.group_duration_multiplier.unwrap_or(1);
    group_reward_distributor.group_duration_multiplier_decimals = ix.group_duration_multiplier_decimals.unwrap_or(0);
    group_reward_distributor.group_count_multiplier = ix.group_count_multiplier;
    group_reward_distributor.group_count_multiplier_decimals = ix.group_count_multiplier_decimals;
    group_reward_distributor.min_group_size = ix.min_group_size;

    Ok(())
}
