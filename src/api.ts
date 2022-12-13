import { tryGetAccount } from "@cardinal/common";
import { BN } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Keypair, Transaction } from "@solana/web3.js";

import type {
  GroupRewardDistributorKind,
  GroupRewardDistributorMetadataKind,
  GroupRewardDistributorPoolKind,
} from "./programs/groupRewardDistributor";
import { getGroupRewardEntry } from "./programs/groupRewardDistributor/accounts";
import { findGroupRewardEntryId } from "./programs/groupRewardDistributor/pda";
import {
  withClaimGroupRewards,
  withCloseGroupRewardEntry,
  withInitGroupRewardDistributor,
  withInitGroupRewardEntry,
  withUpdateGroupRewardDistributor,
} from "./programs/groupRewardDistributor/transaction";
import type { RewardDistributorKind } from "./programs/rewardDistributor";
import { findRewardDistributorId } from "./programs/rewardDistributor/pda";
import {
  withClaimRewards,
  withInitRewardDistributor,
  withInitRewardEntry,
  withUpdateRewardEntry,
} from "./programs/rewardDistributor/transaction";
import { ReceiptType } from "./programs/stakePool";
import {
  getStakeEntries,
  getStakeEntry,
  getStakePool,
} from "./programs/stakePool/accounts";
import {
  withAddToGroupEntry,
  withAuthorizeStakeEntry,
  withClaimReceiptMint,
  withCloseGroupEntry,
  withInitGroupStakeEntry,
  withInitStakeEntry,
  withInitStakeMint,
  withInitStakePool,
  withRemoveFromGroupEntry,
  withStake,
  withUnstake,
  withUpdateTotalStakeSeconds,
} from "./programs/stakePool/transaction";
import { findStakeEntryIdFromMint } from "./programs/stakePool/utils";
import { getMintSupply } from "./utils";

/**
 * Convenience call to create a stake pool
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param requiresCollections - (Optional) List of required collections pubkeys
 * @param requiresCreators - (Optional) List of required creators pubkeys
 * @param requiresAuthorization - (Optional) Boolean to require authorization
 * @param overlayText - (Optional) Text to overlay on receipt mint tokens
 * @param imageUri - (Optional) Image URI for stake pool
 * @param resetOnStake - (Optional) Boolean to reset an entry's total stake seconds on unstake
 * @param cooldownSeconds - (Optional) Number of seconds for token to cool down before returned to the staker
 * @param rewardDistributor - (Optional) Parameters to creat reward distributor
 * @returns
 */
export const createStakePool = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    requiresCollections?: PublicKey[];
    requiresCreators?: PublicKey[];
    requiresAuthorization?: boolean;
    overlayText?: string;
    imageUri?: string;
    resetOnStake?: boolean;
    cooldownSeconds?: number;
    minStakeSeconds?: number;
    endDate?: BN;
    doubleOrResetEnabled?: boolean;
    rewardDistributor?: {
      rewardMintId: PublicKey;
      rewardAmount?: BN;
      rewardDurationSeconds?: BN;
      rewardDistributorKind?: RewardDistributorKind;
      maxSupply?: BN;
      supply?: BN;
    };
  }
): Promise<[Transaction, PublicKey, PublicKey?]> => {
  const transaction = new Transaction();

  const [, stakePoolId] = await withInitStakePool(
    transaction,
    connection,
    wallet,
    params
  );
  let rewardDistributorId;
  if (params.rewardDistributor) {
    [, rewardDistributorId] = await withInitRewardDistributor(
      transaction,
      connection,
      wallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: params.rewardDistributor.rewardMintId,
        rewardAmount: params.rewardDistributor.rewardAmount,
        rewardDurationSeconds: params.rewardDistributor.rewardDurationSeconds,
        kind: params.rewardDistributor.rewardDistributorKind,
        maxSupply: params.rewardDistributor.maxSupply,
        supply: params.rewardDistributor.supply,
      }
    );
  }
  return [transaction, stakePoolId, rewardDistributorId];
};

/**
 * Convenience call to create a reward distributor
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param rewardMintId - (Optional) Reward mint id
 * @param rewardAmount - (Optional) Reward amount
 * @param rewardDurationSeconds - (Optional) Reward duration in seconds
 * @param rewardDistributorKind - (Optional) Reward distributor kind Mint or Treasury
 * @param maxSupply - (Optional) Max supply
 * @param supply - (Optional) Supply
 * @returns
 */
export const createRewardDistributor = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    rewardMintId: PublicKey;
    rewardAmount?: BN;
    rewardDurationSeconds?: BN;
    kind?: RewardDistributorKind;
    maxSupply?: BN;
    supply?: BN;
  }
): Promise<[Transaction, PublicKey]> =>
  withInitRewardDistributor(new Transaction(), connection, wallet, params);

/**
 * Convenience call to create a stake entry
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @param user - (Optional) User pubkey in case the person paying for the transaction and
 * stake entry owner are different
 * @returns
 */
export const createStakeEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
  }
): Promise<[Transaction, PublicKey]> => {
  return withInitStakeEntry(new Transaction(), connection, wallet, {
    stakePoolId: params.stakePoolId,
    originalMintId: params.originalMintId,
  });
};

/**
 * Convenience call to create a stake entry
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @returns
 */
export const initializeRewardEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    multiplier?: BN;
  }
): Promise<Transaction> => {
  const [stakeEntryId] = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );
  const stakeEntryData = await tryGetAccount(() =>
    getStakeEntry(connection, stakeEntryId)
  );

  const transaction = new Transaction();
  if (!stakeEntryData) {
    await withInitStakeEntry(transaction, connection, wallet, {
      stakePoolId: params.stakePoolId,
      originalMintId: params.originalMintId,
    });
  }

  const [rewardDistributorId] = await findRewardDistributorId(
    params.stakePoolId
  );
  await withInitRewardEntry(transaction, connection, wallet, {
    stakeEntryId: stakeEntryId,
    rewardDistributorId: rewardDistributorId,
  });

  await withUpdateRewardEntry(transaction, connection, wallet, {
    stakePoolId: params.stakePoolId,
    rewardDistributorId: rewardDistributorId,
    stakeEntryId: stakeEntryId,
    multiplier: params.multiplier ?? new BN(1), //TODO default multiplier
  });
  return transaction;
};

/**
 * Convenience call to authorize a stake entry
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @returns
 */
export const authorizeStakeEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
  }
): Promise<Transaction> => {
  return withAuthorizeStakeEntry(new Transaction(), connection, wallet, {
    stakePoolId: params.stakePoolId,
    originalMintId: params.originalMintId,
  });
};

/**
 * Convenience call to create a stake entry and a stake mint
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @param amount - (Optional) Amount of tokens to be staked, defaults to 1
 * @returns
 */
export const createStakeEntryAndStakeMint = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    receiptName?: string;
  }
): Promise<[Transaction, PublicKey, Keypair | undefined]> => {
  let transaction = new Transaction();
  const [stakeEntryId] = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );
  const stakeEntryData = await tryGetAccount(() =>
    getStakeEntry(connection, stakeEntryId)
  );
  if (!stakeEntryData) {
    transaction = (
      await createStakeEntry(connection, wallet, {
        stakePoolId: params.stakePoolId,
        originalMintId: params.originalMintId,
      })
    )[0];
  }

  let stakeMintKeypair: Keypair | undefined;
  if (!stakeEntryData?.parsed.stakeMint) {
    stakeMintKeypair = Keypair.generate();
    const stakePool = await getStakePool(connection, params.stakePoolId);

    await withInitStakeMint(transaction, connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: stakeEntryId,
      originalMintId: params.originalMintId,
      stakeMintKeypair,
      name:
        params.receiptName ??
        `POOl${stakePool.parsed.identifier.toString()} RECEIPT`,
      symbol: `POOl${stakePool.parsed.identifier.toString()}`,
    });
  }

  return [transaction, stakeEntryId, stakeMintKeypair];
};

/**
 * Convenience method to claim rewards
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool id
 * @param stakeEntryId - Original mint id
 * @returns
 */
export const claimRewards = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
    lastStaker?: PublicKey;
    payer?: PublicKey;
    skipRewardMintTokenAccount?: boolean;
  }
): Promise<Transaction> => {
  const transaction = new Transaction();

  withUpdateTotalStakeSeconds(transaction, connection, wallet, {
    stakeEntryId: params.stakeEntryId,
    lastStaker: wallet.publicKey,
  });

  await withClaimRewards(transaction, connection, wallet, {
    stakePoolId: params.stakePoolId,
    stakeEntryId: params.stakeEntryId,
    lastStaker: params.lastStaker ?? wallet.publicKey,
    payer: params.payer,
    skipRewardMintTokenAccount: params.skipRewardMintTokenAccount,
  });

  return transaction;
};

/**
 * Convenience method to stake tokens
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool id
 * @param originalMintId - Original mint id
 * @param userOriginalMintTokenAccountId - User's original mint token account id
 * @param receiptType - (Optional) ReceiptType to be received back. If none provided, none will be claimed
 * @param user - (Optional) User pubkey in case the person paying for the transaction and
 * stake entry owner are different
 * @param amount - (Optional) Amount of tokens to be staked, defaults to 1
 * @returns
 */
export const stake = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    userOriginalMintTokenAccountId: PublicKey;
    receiptType?: ReceiptType;
    amount?: BN;
  }
): Promise<Transaction> => {
  const supply = await getMintSupply(connection, params.originalMintId);
  if (
    (supply.gt(new BN(1)) || params.amount?.gt(new BN(1))) &&
    params.receiptType === ReceiptType.Original
  ) {
    throw new Error("Fungible with receipt type Original is not supported yet");
  }

  let transaction = new Transaction();
  const [stakeEntryId] = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );
  const stakeEntryData = await tryGetAccount(() =>
    getStakeEntry(connection, stakeEntryId)
  );
  if (!stakeEntryData) {
    [transaction] = await createStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      originalMintId: params.originalMintId,
    });
  }

  await withStake(transaction, connection, wallet, {
    stakePoolId: params.stakePoolId,
    originalMintId: params.originalMintId,
    userOriginalMintTokenAccountId: params.userOriginalMintTokenAccountId,
    amount: params.amount,
  });

  if (params.receiptType && params.receiptType !== ReceiptType.None) {
    const receiptMintId =
      params.receiptType === ReceiptType.Receipt
        ? stakeEntryData?.parsed.stakeMint
        : params.originalMintId;
    if (!receiptMintId) {
      throw new Error(
        "Stake entry has no stake mint. Initialize stake mint first."
      );
    }
    if (
      stakeEntryData?.parsed.stakeMintClaimed ||
      stakeEntryData?.parsed.originalMintClaimed
    ) {
      throw new Error("Receipt has already been claimed.");
    }

    if (
      !stakeEntryData?.parsed ||
      stakeEntryData.parsed.amount.toNumber() === 0
    ) {
      await withClaimReceiptMint(transaction, connection, wallet, {
        stakePoolId: params.stakePoolId,
        stakeEntryId: stakeEntryId,
        originalMintId: params.originalMintId,
        receiptMintId: receiptMintId,
        receiptType: params.receiptType,
      });
    }
  }

  return transaction;
};

/**
 * Convenience method to unstake tokens
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @returns
 */
export const unstake = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    skipRewardMintTokenAccount?: boolean;
  }
): Promise<Transaction> =>
  withUnstake(new Transaction(), connection, wallet, params);

/**
 * Convenience call to create a group entry
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param stakePoolId - Stake pool ID
 * @param originalMintId - Original mint ID
 * @param user - (Optional) User pubkey in case the person paying for the transaction and
 * stake entry owner are different
 * @returns
 */
export const createGroupEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    stakeEntryIds: PublicKey[];
    minGroupDays?: number;
  }
): Promise<[Transaction, PublicKey, Keypair[]]> => {
  if (!params.stakeEntryIds.length) throw new Error("No stake entry found");
  const [transaction, groupEntryId, signers] = await withInitGroupStakeEntry(
    new Transaction(),
    connection,
    wallet,
    {
      stakeEntryId: params.stakeEntryIds[0]!,
      minGroupDays: params.minGroupDays,
    }
  );

  await Promise.all(
    params.stakeEntryIds.slice(1).map((stakeEntryId) =>
      withAddToGroupEntry(transaction, connection, wallet, {
        groupEntryId,
        stakeEntryId,
      })
    )
  );

  return [transaction, groupEntryId, signers];
};

/**
 * Convenience call to create a group reward distributor
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param authorizedPools - Authorized stake pool ids
 * @param rewardMintId - (Optional) Reward mint id
 * @param rewardAmount - (Optional) Reward amount
 * @param rewardDurationSeconds - (Optional) Reward duration in seconds
 * @param rewardKind - (Optional) Reward distributor kind Mint or Treasury
 * @param poolKind - (Optional) Reward distributor pool validation kind NoRestriction, AllFromSinglePool or EachFromSeparatePool
 * @param metadataKind - (Optional) Reward distributor metadata validation kind NoRestriction, UniqueNames or UniqueSymbols
 * @param maxSupply - (Optional) Max supply
 * @param supply - (Optional) Supply
 * @param defaultMultiplier - (Optional) default multiplier
 * @param multiplierDecimals - (Optional) multiplier decimals
 * @param groupDaysMultiplier - (Optional) group days multiplier
 * @param groupDaysMultiplierDecimals - (Optional) group days multiplier decimals
 * @param maxRewardSecondsReceived - (Optional) max reward seconds received
 * @param minGroupSize - (Optional) min group size
 * @returns
 */
export const createGroupRewardDistributor = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    authorizedPools: PublicKey[];
    rewardMintId: PublicKey;
    rewardAmount?: BN;
    rewardDurationSeconds?: BN;
    rewardKind?: GroupRewardDistributorKind;
    poolKind?: GroupRewardDistributorPoolKind;
    metadataKind?: GroupRewardDistributorMetadataKind;
    maxSupply?: BN;
    supply?: BN;
    defaultMultiplier?: BN;
    multiplierDecimals?: number;
    groupDaysMultiplier?: BN;
    groupDaysMultiplierDecimals?: number;
    maxRewardSecondsReceived?: BN;
    minGroupSize?: number;
  }
): Promise<[Transaction, PublicKey, Keypair[]]> =>
  withInitGroupRewardDistributor(new Transaction(), connection, wallet, params);

/**
 * Convenience call to update a group reward distributor
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param authorizedPools - Authorized stake pool ids
 * @param rewardMintId - (Optional) Reward mint id
 * @param rewardAmount - (Optional) Reward amount
 * @param rewardDurationSeconds - (Optional) Reward duration in seconds
 * @param poolKind - (Optional) Reward distributor pool validation kind NoRestriction, AllFromSinglePool or EachFromSeparatePool
 * @param metadataKind - (Optional) Reward distributor metadata validation kind NoRestriction, UniqueNames or UniqueSymbols
 * @param maxSupply - (Optional) Max supply
 * @param defaultMultiplier - (Optional) default multiplier
 * @param multiplierDecimals - (Optional) multiplier decimals
 * @param groupDaysMultiplier - (Optional) group days multiplier
 * @param groupDaysMultiplierDecimals - (Optional) group days multiplier decimals
 * @param maxRewardSecondsReceived - (Optional) max reward seconds received
 * @param minGroupSize - (Optional) min group size
 * @returns
 */
export const updateGroupRewardDistributor = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    authorizedPools: PublicKey[];
    rewardMintId: PublicKey;
    rewardAmount?: BN;
    rewardDurationSeconds?: BN;
    poolKind?: GroupRewardDistributorPoolKind;
    metadataKind?: GroupRewardDistributorMetadataKind;
    maxSupply?: BN;
    defaultMultiplier?: BN;
    multiplierDecimals?: number;
    groupDaysMultiplier?: BN;
    groupDaysMultiplierDecimals?: number;
    maxRewardSecondsReceived?: BN;
    minGroupSize?: number;
  }
): Promise<Transaction> =>
  withUpdateGroupRewardDistributor(
    new Transaction(),
    connection,
    wallet,
    params
  );

/**
 * Convenience method to claim rewards
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param groupRewardDistributorId - Group reward distributor ID
 * @param groupEntryId - Group entry ID
 * @param stakeEntryIds - Stake entry IDs
 * @returns
 */
export const claimGroupRewards = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
    stakeEntryIds: PublicKey[];
  }
): Promise<[Transaction]> => {
  const transaction = new Transaction();

  const [groupRewardEntryId] = await findGroupRewardEntryId(
    params.groupRewardDistributorId,
    params.groupEntryId
  );

  const groupRewardEntry = await tryGetAccount(() =>
    getGroupRewardEntry(connection, groupRewardEntryId)
  );
  if (!groupRewardEntry) {
    const stakeEntries = await getStakeEntries(
      connection,
      params.stakeEntryIds
    );

    await withInitGroupRewardEntry(transaction, connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupEntryId: params.groupEntryId,
      stakeEntries: stakeEntries.map((stakeEntry) => ({
        stakeEntryId: stakeEntry.pubkey,
        originalMint: stakeEntry.parsed.originalMint,
      })),
    });
  }

  await withClaimGroupRewards(transaction, connection, wallet, {
    groupRewardDistributorId: params.groupRewardDistributorId,
    groupEntryId: params.groupEntryId,
  });

  return [transaction];
};

/**
 * Convenience method to close group stake entry
 * @param connection - Connection to use
 * @param wallet - Wallet to use
 * @param groupRewardDistributorId - Group reward distributor ID
 * @param groupEntryId - Group entry ID
 * @param stakeEntryIds - Stake entry IDs
 * @returns
 */
export const closeGroupEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
    stakeEntryIds: PublicKey[];
  }
): Promise<[Transaction]> => {
  const [transaction] = await claimGroupRewards(connection, wallet, params);

  await withCloseGroupRewardEntry(transaction, connection, wallet, {
    groupEntryId: params.groupEntryId,
    groupRewardDistributorId: params.groupRewardDistributorId,
  });

  await Promise.all(
    params.stakeEntryIds.map((stakeEntryId) =>
      withRemoveFromGroupEntry(transaction, connection, wallet, {
        groupEntryId: params.groupEntryId,
        stakeEntryId,
      })
    )
  );

  await withCloseGroupEntry(transaction, connection, wallet, {
    groupEntryId: params.groupEntryId,
  });
  return [transaction];
};
