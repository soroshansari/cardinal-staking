use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    cardinal_stake_pool::state::{GroupStakeEntry, StakeEntry},
    core::hash::Hash,
    mpl_token_metadata::{state::Metadata, utils::assert_derivation},
    std::collections::HashSet,
};

#[derive(Accounts)]
pub struct InitGroupRewardEntryCtx<'info> {
    #[account(
        init,
        payer = authority,
        space = GROUP_REWARD_ENTRY_SIZE,
        seeds = [GROUP_REWARD_ENTRY_SEED.as_bytes(), group_reward_distributor.key().as_ref(), group_entry.key().as_ref()],
        bump,
    )]
    group_reward_entry: Box<Account<'info, GroupRewardEntry>>,

    #[account(mut, has_one = authority, has_one = group_reward_distributor)]
    group_reward_counter: Box<Account<'info, GroupRewardCounter>>,

    #[account(mut, has_one = authority)]
    group_entry: Box<Account<'info, GroupStakeEntry>>,

    #[account(mut)]
    group_reward_distributor: Box<Account<'info, GroupRewardDistributor>>,

    #[account(mut)]
    authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InitGroupRewardEntryCtx>) -> Result<()> {
    let group_reward_counter = &mut ctx.accounts.group_reward_counter;
    let group_reward_distributor = &mut ctx.accounts.group_reward_distributor;
    let group_reward_entry = &mut ctx.accounts.group_reward_entry;
    let group_entry = &mut ctx.accounts.group_entry;
    group_reward_entry.bump = *ctx.bumps.get("group_reward_entry").unwrap();
    group_reward_entry.group_reward_distributor = group_reward_distributor.key();
    group_reward_entry.group_entry = group_entry.key();
    group_reward_entry.reward_seconds_received = 0;
    group_reward_entry.multiplier = group_reward_distributor.default_multiplier;
    group_reward_counter.count += 1;

    if group_reward_distributor.min_group_size.is_some() && Some(group_entry.stake_entries.len() as u8) < group_reward_distributor.min_group_size {
        return Err(error!(ErrorCode::InvalidGroupSize));
    }

    let mut metadata_names = Vec::new();
    let mut metadata_symbols = Vec::new();
    let mut stake_pools = Vec::new();

    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    for i in 0..group_entry.stake_entries.len() {
        let stake_entry = next_account_info(remaining_accounts)?;
        if stake_entry.data_is_empty() || group_entry.stake_entries[i] != stake_entry.key() {
            return Err(error!(ErrorCode::InvalidStakeEntry));
        }

        let stake_entry_data = stake_entry.try_borrow_mut_data().expect("Failed to borrow data");
        let stake_entry = StakeEntry::deserialize(&mut stake_entry_data[8..].as_ref())?;
        if !group_reward_distributor.authorized_pools.contains(&stake_entry.pool) {
            return Err(error!(ErrorCode::InvalidPool));
        }

        let original_mint = next_account_info(remaining_accounts)?;
        if original_mint.data_is_empty() {
            return Err(error!(ErrorCode::InvalidOriginalMint));
        }

        let original_mint_metadata = next_account_info(remaining_accounts)?;
        if original_mint_metadata.data_is_empty() {
            return Err(error!(ErrorCode::InvalidMintMetadata));
        }

        assert_derivation(
            &mpl_token_metadata::id(),
            &original_mint_metadata.to_account_info(),
            &[mpl_token_metadata::state::PREFIX.as_bytes(), mpl_token_metadata::id().as_ref(), original_mint.key().as_ref()],
        )?;

        if original_mint_metadata.owner.key() != mpl_token_metadata::id() {
            return Err(error!(ErrorCode::InvalidMintMetadataOwner));
        }

        let original_mint_metadata_data = original_mint_metadata.try_borrow_mut_data().expect("Failed to borrow data");
        let original_mint_metadata = Metadata::deserialize(&mut original_mint_metadata_data.as_ref()).expect("Failed to deserialize metadata");
        if original_mint_metadata.mint != original_mint.key() {
            return Err(error!(ErrorCode::InvalidMintMetadata));
        }

        metadata_names.push(original_mint_metadata.data.name);
        metadata_symbols.push(original_mint_metadata.data.symbol);
        stake_pools.push(stake_entry.pool);
    }

    match group_reward_distributor.metadata_kind {
        k if k == GroupRewardDistributorMetadataKind::UniqueNames as u8 => {
            if !has_unique_elements(metadata_names) {
                return Err(error!(ErrorCode::InvalidStakeEntry));
            }
        }
        k if k == GroupRewardDistributorMetadataKind::UniqueSymbols as u8 => {
            if !has_unique_elements(metadata_symbols) {
                return Err(error!(ErrorCode::InvalidStakeEntry));
            }
        }
        _ => {}
    }

    match group_reward_distributor.pool_kind {
        k if k == GroupRewardDistributorPoolKind::AllFromSinglePool as u8 => {
            if !is_all_same(stake_pools) {
                return Err(error!(ErrorCode::InvalidStakeEntry));
            }
        }
        k if k == GroupRewardDistributorPoolKind::EachFromSeparatePool as u8 => {
            if !has_unique_elements(stake_pools) {
                return Err(error!(ErrorCode::InvalidStakeEntry));
            }
        }
        _ => {}
    }

    Ok(())
}

fn has_unique_elements<T>(iter: T) -> bool
where
    T: IntoIterator,
    T::Item: Eq + Hash,
{
    let mut uniq = HashSet::new();
    iter.into_iter().all(move |x| uniq.insert(x))
}

fn is_all_same<T>(iter: T) -> bool
where
    T: IntoIterator,
    T::Item: Eq + Hash,
{
    let mut arr = iter.into_iter();
    let first = arr.next();

    arr.all(|x| Some(x) == first)
}
