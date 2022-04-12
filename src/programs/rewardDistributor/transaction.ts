import {
  tryGetAccount,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import type { web3 } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import type { Connection, PublicKey, Transaction } from "@solana/web3.js";

import { getRewardDistributor } from "./accounts";
import { RewardDistributorKind } from "./constants";
import {
  claimRewards,
  close,
  initRewardDistributor,
  initRewardEntry,
} from "./instruction";
import { findRewardDistributorId } from "./pda";
import { withRemainingAccountsForKind } from "./utils";

export const withInitRewardDistributor = async (
  transaction: Transaction,
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
): Promise<[Transaction, web3.PublicKey]> => {
  const [rewardDistributorId] = await findRewardDistributorId(
    params.stakePoolId
  );
  const remainingAccountsForKind = await withRemainingAccountsForKind(
    transaction,
    connection,
    wallet,
    rewardDistributorId,
    params.kind || RewardDistributorKind.Mint,
    params.rewardMintId
  );
  transaction.add(
    initRewardDistributor(connection, wallet, {
      rewardDistributorId,
      stakePoolId: params.stakePoolId,
      rewardMintId: params.rewardMintId,
      rewardAmount: params.rewardAmount || new BN(1),
      rewardDurationSeconds: params.rewardDurationSeconds || new BN(1),
      kind: params.kind || RewardDistributorKind.Mint,
      remainingAccountsForKind,
      maxSupply: params.maxSupply,
      supply: params.supply,
    })
  );
  return [transaction, rewardDistributorId];
};

export const withInitRewardEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    mintId: PublicKey;
    rewardDistributorId: PublicKey;
    multiplier?: BN;
  }
): Promise<Transaction> => {
  return transaction.add(
    await initRewardEntry(connection, wallet, {
      mint: params.mintId,
      rewardDistributor: params.rewardDistributorId,
      multiplier: params.multiplier || new BN(0),
    })
  );
};

export const withClaimRewards = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMint: PublicKey;
  }
): Promise<Transaction> => {
  const [rewardDistributorId] = await findRewardDistributorId(
    params.stakePoolId
  );
  const rewardDistributorData = await tryGetAccount(() =>
    getRewardDistributor(connection, rewardDistributorId)
  );

  if (rewardDistributorData) {
    const rewardMintTokenAccountId = await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      rewardDistributorData.parsed.rewardMint,
      wallet.publicKey,
      wallet.publicKey
    );

    const remainingAccountsForKind = await withRemainingAccountsForKind(
      transaction,
      connection,
      wallet,
      rewardDistributorId,
      rewardDistributorData.parsed.kind,
      rewardDistributorData.parsed.rewardMint
    );

    transaction.add(
      await claimRewards(connection, wallet, {
        stakePoolId: params.stakePoolId,
        originalMintId: params.originalMint,
        rewardMintId: rewardDistributorData.parsed.rewardMint,
        rewardMintTokenAccountId: rewardMintTokenAccountId,
        remainingAccountsForKind,
      })
    );
  }
  return transaction;
};

export const withClose = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
  }
): Promise<Transaction> => {
  const [rewardDistributorId] = await findRewardDistributorId(
    params.stakePoolId
  );
  const rewardDistributorData = await tryGetAccount(() =>
    getRewardDistributor(connection, rewardDistributorId)
  );

  if (rewardDistributorData) {
    const remainingAccountsForKind = await withRemainingAccountsForKind(
      transaction,
      connection,
      wallet,
      rewardDistributorId,
      rewardDistributorData.parsed.kind,
      rewardDistributorData.parsed.rewardMint
    );

    transaction.add(
      await close(connection, wallet, {
        stakePoolId: params.stakePoolId,
        rewardMintId: rewardDistributorData.parsed.rewardMint,
        remainingAccountsForKind,
      })
    );
  }
  return transaction;
};