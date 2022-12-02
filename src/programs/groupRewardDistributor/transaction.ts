import {
  findAta,
  tryGetAccount,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import * as metaplex from "@metaplex-foundation/mpl-token-metadata";
import type { web3 } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { findRewardEntryId } from "../rewardDistributor/pda";
import { getGroupRewardCounter, getGroupRewardDistributor } from "./accounts";
import {
  GroupRewardDistributorKind,
  GroupRewardDistributorMetadataKind,
  GroupRewardDistributorPoolKind,
} from "./constants";
import {
  claimGroupRewards,
  closeGroupRewardCounter,
  closeGroupRewardDistributor,
  closeGroupRewardEntry,
  initGroupRewardCounter,
  initGroupRewardDistributor,
  initGroupRewardEntry,
  reclaimGroupFunds,
  updateGroupRewardDistributor,
  updateGroupRewardEntry,
} from "./instruction";
import { findGroupRewardCounterId, findGroupRewardEntryId } from "./pda";
import { withRemainingAccountsForRewardKind } from "./utils";

export const withInitGroupRewardDistributor = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    rewardMintId: PublicKey;
    authorizedPools: PublicKey[];
    rewardAmount?: BN;
    rewardDurationSeconds?: BN;
    rewardKind?: GroupRewardDistributorKind;
    poolKind?: GroupRewardDistributorPoolKind;
    metadataKind?: GroupRewardDistributorMetadataKind;
    supply?: BN;
    baseAdder?: BN;
    baseAdderDecimals?: number;
    baseMultiplier?: BN;
    baseMultiplierDecimals?: number;
    multiplierDecimals?: number;
    maxSupply?: BN;
    minCooldownSeconds?: number;
    minStakeSeconds?: number;
    groupCountMultiplier?: BN;
    groupCountMultiplierDecimals?: number;
    minGroupSize?: number;
    maxRewardSecondsReceived?: BN;
  }
): Promise<[Transaction, web3.PublicKey]> => {
  const [tx, groupRewardDistributorId] = await initGroupRewardDistributor(
    connection,
    wallet,
    {
      rewardAmount: params.rewardAmount || new BN(1),
      rewardDurationSeconds: params.rewardDurationSeconds || new BN(1),
      rewardKind: params.rewardKind || GroupRewardDistributorKind.Mint,
      metadataKind:
        params.metadataKind || GroupRewardDistributorMetadataKind.NoRestriction,
      poolKind: params.poolKind || GroupRewardDistributorPoolKind.NoRestriction,
      authorizedPools: params.authorizedPools,
      supply: params.supply,
      baseAdder: params.baseAdder,
      baseAdderDecimals: params.baseAdderDecimals,
      baseMultiplier: params.baseMultiplier,
      baseMultiplierDecimals: params.baseMultiplierDecimals,
      multiplierDecimals: params.multiplierDecimals,
      maxSupply: params.maxSupply,
      minCooldownSeconds: params.minCooldownSeconds,
      minStakeSeconds: params.minStakeSeconds,
      groupCountMultiplier: params.groupCountMultiplier,
      groupCountMultiplierDecimals: params.groupCountMultiplierDecimals,
      minGroupSize: params.minGroupSize,
      maxRewardSecondsReceived: params.maxRewardSecondsReceived,

      rewardMintId: params.rewardMintId,
    }
  );
  transaction.add(tx);
  return [transaction, groupRewardDistributorId];
};

export const withInitGroupRewardEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
    rewardDistributorId: PublicKey;
    stakeEntries: {
      stakeEntryId: PublicKey;
      originalMint: PublicKey;
    }[];
  }
): Promise<[Transaction, PublicKey]> => {
  const [[groupRewardEntryId], [groupRewardCounterId]] = await Promise.all([
    findGroupRewardEntryId(
      params.groupRewardDistributorId,
      params.groupEntryId
    ),
    findGroupRewardCounterId(params.groupRewardDistributorId, wallet.publicKey),
  ]);

  const groupRewardCounter = await tryGetAccount(() =>
    getGroupRewardCounter(connection, groupRewardCounterId)
  );
  if (!groupRewardCounter) {
    transaction.add(
      await initGroupRewardCounter(connection, wallet, {
        groupRewardCounterId,
        groupRewardDistributorId: params.groupRewardDistributorId,
        authority: wallet.publicKey,
      })
    );
  }

  const stakeEntries = await Promise.all(
    params.stakeEntries.map(async ({ stakeEntryId, originalMint }) => {
      const [[rewardEntryId], originalMintMetadata] = await Promise.all([
        findRewardEntryId(params.rewardDistributorId, stakeEntryId),
        metaplex.Metadata.getPDA(originalMint),
      ]);
      return {
        stakeEntryId,
        originalMint,
        originalMintMetadata,
        rewardEntryId,
      };
    })
  );

  transaction.add(
    await initGroupRewardEntry(connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupEntryId: params.groupEntryId,
      groupRewardCounterId,
      groupRewardEntryId,
      stakeEntries,
    })
  );
  return [transaction, groupRewardEntryId];
};

export const withClaimGroupRewards = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
    skipGroupRewardMintTokenAccount?: boolean;
  }
): Promise<Transaction> => {
  const groupRewardDistributorData = await tryGetAccount(() =>
    getGroupRewardDistributor(connection, params.groupRewardDistributorId)
  );

  if (groupRewardDistributorData) {
    const userRewardMintTokenAccount = params.skipGroupRewardMintTokenAccount
      ? await findAta(
          groupRewardDistributorData.parsed.rewardMint,
          wallet.publicKey,
          true
        )
      : await withFindOrInitAssociatedTokenAccount(
          transaction,
          connection,
          groupRewardDistributorData.parsed.rewardMint,
          wallet.publicKey,
          wallet.publicKey
        );

    const remainingAccountsForKind = await withRemainingAccountsForRewardKind(
      transaction,
      connection,
      wallet,
      groupRewardDistributorData.pubkey,
      groupRewardDistributorData.parsed
        .rewardKind as GroupRewardDistributorKind,
      groupRewardDistributorData.parsed.rewardMint,
      true
    );

    const [[groupRewardEntryId], [groupRewardCounterId]] = await Promise.all([
      findGroupRewardEntryId(
        groupRewardDistributorData.pubkey,
        params.groupEntryId
      ),
      findGroupRewardCounterId(
        groupRewardDistributorData.pubkey,
        wallet.publicKey
      ),
    ]);

    transaction.add(
      await claimGroupRewards(connection, wallet, {
        groupEntryId: params.groupEntryId,
        groupRewardDistributorId: params.groupRewardDistributorId,
        groupRewardEntryId,
        groupRewardCounterId,
        userRewardMintTokenAccount,
        authority: wallet.publicKey,
        rewardMintId: groupRewardDistributorData.parsed.rewardMint,
        remainingAccountsForKind,
      })
    );
  }
  return transaction;
};

export const withCloseGroupRewardDistributor = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
  }
): Promise<Transaction> => {
  const groupRewardDistributorData = await tryGetAccount(() =>
    getGroupRewardDistributor(connection, params.groupRewardDistributorId)
  );

  if (groupRewardDistributorData) {
    const remainingAccountsForKind = await withRemainingAccountsForRewardKind(
      transaction,
      connection,
      wallet,
      groupRewardDistributorData.pubkey,
      groupRewardDistributorData.parsed
        .rewardKind as GroupRewardDistributorKind,
      groupRewardDistributorData.parsed.rewardMint
    );

    transaction.add(
      await closeGroupRewardDistributor(connection, wallet, {
        groupRewardDistributorId: params.groupRewardDistributorId,
        rewardMintId: groupRewardDistributorData.parsed.rewardMint,
        remainingAccountsForKind,
      })
    );
  }
  return transaction;
};

export const withUpdateGroupRewardEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupRewardEntryId: PublicKey;
    multiplier: BN;
  }
): Promise<Transaction> => {
  return transaction.add(
    await updateGroupRewardEntry(connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupRewardEntryId: params.groupRewardEntryId,
      multiplier: params.multiplier,
    })
  );
};

export const withCloseGroupRewardEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
  }
): Promise<Transaction> => {
  const [[groupRewardEntryId], [groupRewardCounterId]] = await Promise.all([
    findGroupRewardEntryId(
      params.groupRewardDistributorId,
      params.groupEntryId
    ),
    findGroupRewardCounterId(params.groupRewardDistributorId, wallet.publicKey),
  ]);

  return transaction.add(
    await closeGroupRewardEntry(connection, wallet, {
      groupEntryId: params.groupEntryId,
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupRewardEntryId,
      groupRewardCounterId,
    })
  );
};

export const withUpdateGroupRewardDistributor = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    authorizedPools: PublicKey[];
    rewardAmount?: BN;
    rewardDurationSeconds?: BN;
    poolKind?: GroupRewardDistributorPoolKind;
    metadataKind?: GroupRewardDistributorMetadataKind;
    baseAdder?: BN;
    baseAdderDecimals?: number;
    baseMultiplier?: BN;
    baseMultiplierDecimals?: number;
    multiplierDecimals?: number;
    maxSupply?: BN;
    minCooldownSeconds?: number;
    minStakeSeconds?: number;
    groupCountMultiplier?: BN;
    groupCountMultiplierDecimals?: number;
    minGroupSize?: number;
    maxRewardSecondsReceived?: BN;
  }
): Promise<Transaction> => {
  return transaction.add(
    await updateGroupRewardDistributor(connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      rewardAmount: params.rewardAmount || new BN(1),
      rewardDurationSeconds: params.rewardDurationSeconds || new BN(1),
      metadataKind:
        params.metadataKind || GroupRewardDistributorMetadataKind.NoRestriction,
      poolKind: params.poolKind || GroupRewardDistributorPoolKind.NoRestriction,
      authorizedPools: params.authorizedPools,
      baseAdder: params.baseAdder,
      baseAdderDecimals: params.baseAdderDecimals,
      baseMultiplier: params.baseMultiplier,
      baseMultiplierDecimals: params.baseMultiplierDecimals,
      multiplierDecimals: params.multiplierDecimals,
      maxSupply: params.maxSupply,
      minCooldownSeconds: params.minCooldownSeconds,
      minStakeSeconds: params.minStakeSeconds,
      groupCountMultiplier: params.groupCountMultiplier,
      groupCountMultiplierDecimals: params.groupCountMultiplierDecimals,
      minGroupSize: params.minGroupSize,
      maxRewardSecondsReceived: params.maxRewardSecondsReceived,
    })
  );
};

export const withReclaimGroupFunds = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    amount: BN;
  }
): Promise<Transaction> => {
  const groupRewardDistributorData = await tryGetAccount(() =>
    getGroupRewardDistributor(connection, params.groupRewardDistributorId)
  );
  if (!groupRewardDistributorData) {
    throw new Error("No reward distrbutor found");
  }

  const groupRewardDistributorTokenAccountId = await findAta(
    groupRewardDistributorData.parsed.rewardMint,
    groupRewardDistributorData.pubkey,
    true
  );

  const authorityTokenAccountId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    groupRewardDistributorData.parsed.rewardMint,
    wallet.publicKey,
    wallet.publicKey,
    true
  );

  return transaction.add(
    await reclaimGroupFunds(connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupRewardDistributorTokenAccountId,
      authorityTokenAccountId,
      authority: wallet.publicKey,
      amount: params.amount,
    })
  );
};

export const withCloseGroupRewardCounter = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupEntryId: PublicKey;
    stakeEntries: {
      stakeEntryId: PublicKey;
      originalMint: PublicKey;
    }[];
  }
): Promise<[Transaction]> => {
  const [groupRewardCounterId] = await findGroupRewardCounterId(
    params.groupRewardDistributorId,
    wallet.publicKey
  );

  transaction.add(
    await closeGroupRewardCounter(connection, wallet, {
      groupRewardDistributorId: params.groupRewardDistributorId,
      groupRewardCounterId,
      authority: wallet.publicKey,
    })
  );
  return [transaction];
};
