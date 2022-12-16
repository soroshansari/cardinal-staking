import {
  findAta,
  findMintMetadataId,
  tryGetAccount,
  withFindOrInitAssociatedTokenAccount,
} from "@cardinal/common";
import { getPaymentManager } from "@cardinal/payment-manager/dist/cjs/accounts";
import { tokenManager } from "@cardinal/token-manager/dist/cjs/programs";
import { withRemainingAccountsForReturn } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import {
  findMintManagerId,
  findTokenManagerAddress,
  tokenManagerAddressFromMint,
} from "@cardinal/token-manager/dist/cjs/programs/tokenManager/pda";
import { BN } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

import { getMintSupply } from "../../utils";
import { getRewardDistributor } from "../rewardDistributor/accounts";
import { findRewardDistributorId } from "../rewardDistributor/pda";
import { withClaimRewards } from "../rewardDistributor/transaction";
import {
  getPoolIdentifier,
  getStakeBooster,
  getStakeEntry,
  getStakePool,
} from "./accounts";
import { ReceiptType } from "./constants";
import {
  addToGroupEntry,
  authorizeStakeEntry,
  boostStakeEntry,
  claimReceiptMint,
  closeGroupEntry,
  closeStakeBooster,
  closeStakeEntry,
  closeStakePool,
  deauthorizeStakeEntry,
  doubleOrResetTotalStakeSeconds,
  initGroupStakeEntry,
  initPoolIdentifier,
  initStakeBooster,
  initStakeEntry,
  initStakeMint,
  initStakePool,
  reassignStakeEntry,
  removeFromGroupEntry,
  returnReceiptMint,
  stake,
  unstake,
  updateStakeBooster,
  updateStakePool,
  updateTotalStakeSeconds,
} from "./instruction";
import { findIdentifierId, findStakeBoosterId, findStakePoolId } from "./pda";
import {
  findStakeEntryIdFromMint,
  withRemainingAccountsForUnstake,
} from "./utils";

/**
 * Add init pool identifier instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @returns Transaction, public key for the created pool identifier
 */
export const withInitPoolIdentifier = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet
): [Transaction, PublicKey] => {
  const identifierId = findIdentifierId();
  transaction.add(
    initPoolIdentifier(connection, wallet, {
      identifierId,
    })
  );
  return [transaction, identifierId];
};

export const withInitStakePool = async (
  transaction: Transaction,
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
  }
): Promise<[Transaction, PublicKey]> => {
  const identifierId = findIdentifierId();
  const identifierData = await tryGetAccount(() =>
    getPoolIdentifier(connection)
  );
  const identifier = identifierData?.parsed.count || new BN(1);

  if (!identifierData) {
    transaction.add(
      initPoolIdentifier(connection, wallet, {
        identifierId: identifierId,
      })
    );
  }

  const stakePoolId = findStakePoolId(identifier);
  transaction.add(
    initStakePool(connection, wallet, {
      identifierId: identifierId,
      stakePoolId: stakePoolId,
      requiresCreators: params.requiresCreators || [],
      requiresCollections: params.requiresCollections || [],
      requiresAuthorization: params.requiresAuthorization,
      overlayText: params.overlayText || "",
      imageUri: params.imageUri || "",
      authority: wallet.publicKey,
      resetOnStake: params.resetOnStake || false,
      cooldownSeconds: params.cooldownSeconds,
      minStakeSeconds: params.minStakeSeconds,
      endDate: params.endDate,
      doubleOrResetEnabled: params.doubleOrResetEnabled,
    })
  );
  return [transaction, stakePoolId];
};

/**
 * Add init stake entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, public key for the created stake entry
 */
export const withInitStakeEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
  }
): Promise<[Transaction, PublicKey]> => {
  const stakeEntryId = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );
  const originalMintMetadatId = findMintMetadataId(params.originalMintId);

  transaction.add(
    initStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: stakeEntryId,
      originalMintId: params.originalMintId,
      originalMintMetadatId: originalMintMetadatId,
    })
  );
  return [transaction, stakeEntryId];
};

/**
 * Add authorize stake entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction
 */
export const withAuthorizeStakeEntry = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
  }
): Transaction => {
  transaction.add(
    authorizeStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      originalMintId: params.originalMintId,
    })
  );
  return transaction;
};

/**
 * Add authorize stake entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction
 */
export const withDeauthorizeStakeEntry = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
  }
): Transaction => {
  transaction.add(
    deauthorizeStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      originalMintId: params.originalMintId,
    })
  );
  return transaction;
};

/**
 * Add init stake mint instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, keypair of the created stake mint
 */
export const withInitStakeMint = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
    originalMintId: PublicKey;
    stakeMintKeypair: Keypair;
    name: string;
    symbol: string;
  }
): Promise<[Transaction, Keypair]> => {
  const [mintManagerId] = await findMintManagerId(
    params.stakeMintKeypair.publicKey
  );
  const originalMintMetadataId = findMintMetadataId(params.originalMintId);
  const stakeMintMetadataId = findMintMetadataId(
    params.stakeMintKeypair.publicKey
  );
  const stakeEntryStakeMintTokenAccountId = await findAta(
    params.stakeMintKeypair.publicKey,
    params.stakeEntryId,
    true
  );

  transaction.add(
    initStakeMint(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: params.stakeEntryId,
      originalMintId: params.originalMintId,
      originalMintMetadatId: originalMintMetadataId,
      stakeEntryStakeMintTokenAccountId: stakeEntryStakeMintTokenAccountId,
      stakeMintId: params.stakeMintKeypair.publicKey,
      stakeMintMetadataId: stakeMintMetadataId,
      mintManagerId: mintManagerId,
      name: params.name,
      symbol: params.symbol,
    })
  );
  return [transaction, params.stakeMintKeypair];
};

/**
 * Add claim receipt mint instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction
 */
export const withClaimReceiptMint = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
    originalMintId: PublicKey;
    receiptMintId: PublicKey;
    receiptType: ReceiptType;
  }
): Promise<Transaction> => {
  if (
    params.receiptType === ReceiptType.Original &&
    (await getMintSupply(connection, params.receiptMintId)).gt(new BN(1))
  ) {
    throw new Error(
      "Fungible staking and locked reecipt type not supported yet"
    );
  }

  const tokenManagerReceiptMintTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      params.receiptMintId,
      (
        await findTokenManagerAddress(params.receiptMintId)
      )[0],
      wallet.publicKey,
      true
    );

  transaction.add(
    await claimReceiptMint(connection, wallet, {
      stakeEntryId: params.stakeEntryId,
      tokenManagerReceiptMintTokenAccountId:
        tokenManagerReceiptMintTokenAccountId,
      originalMintId: params.originalMintId,
      receiptMintId: params.receiptMintId,
      receiptType: params.receiptType,
    })
  );
  return transaction;
};

/**
 * Add stake instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction
 */
export const withStake = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    userOriginalMintTokenAccountId: PublicKey;
    amount?: BN;
  }
): Promise<Transaction> => {
  const stakeEntryId = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );
  const stakeEntryOriginalMintTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      params.originalMintId,
      stakeEntryId,
      wallet.publicKey,
      true
    );

  transaction.add(
    stake(connection, wallet, {
      stakeEntryId: stakeEntryId,
      stakePoolId: params.stakePoolId,
      originalMint: params.originalMintId,
      stakeEntryOriginalMintTokenAccountId:
        stakeEntryOriginalMintTokenAccountId,
      userOriginalMintTokenAccountId: params.userOriginalMintTokenAccountId,
      amount: params.amount || new BN(1),
    })
  );

  return transaction;
};

/**
 * Add unstake instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction
 */
export const withUnstake = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    originalMintId: PublicKey;
    skipRewardMintTokenAccount?: boolean;
  }
): Promise<Transaction> => {
  const rewardDistributorId = findRewardDistributorId(params.stakePoolId);
  const stakeEntryId = await findStakeEntryIdFromMint(
    connection,
    wallet.publicKey,
    params.stakePoolId,
    params.originalMintId
  );

  const [stakeEntryData, rewardDistributorData] = await Promise.all([
    tryGetAccount(() => getStakeEntry(connection, stakeEntryId)),
    tryGetAccount(() => getRewardDistributor(connection, rewardDistributorId)),
  ]);

  if (!stakeEntryData) throw "Stake entry not found";

  const stakePoolData = await getStakePool(connection, params.stakePoolId);

  if (
    (!stakePoolData.parsed.cooldownSeconds ||
      stakePoolData.parsed.cooldownSeconds === 0 ||
      (stakeEntryData?.parsed.cooldownStartSeconds &&
        Date.now() / 1000 -
          stakeEntryData.parsed.cooldownStartSeconds.toNumber() >=
          stakePoolData.parsed.cooldownSeconds)) &&
    (!stakePoolData.parsed.minStakeSeconds ||
      stakePoolData.parsed.minStakeSeconds === 0 ||
      (stakeEntryData?.parsed.lastStakedAt &&
        Date.now() / 1000 - stakeEntryData.parsed.lastStakedAt.toNumber() >=
          stakePoolData.parsed.minStakeSeconds)) &&
    (stakeEntryData.parsed.originalMintClaimed ||
      stakeEntryData.parsed.stakeMintClaimed)
  ) {
    // return receipt mint if its claimed
    await withReturnReceiptMint(transaction, connection, wallet, {
      stakeEntryId: stakeEntryId,
    });
  }

  const stakeEntryOriginalMintTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      params.originalMintId,
      stakeEntryId,
      wallet.publicKey,
      true
    );

  const userOriginalMintTokenAccountId =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      params.originalMintId,
      wallet.publicKey,
      wallet.publicKey
    );

  const remainingAccounts = await withRemainingAccountsForUnstake(
    transaction,
    connection,
    wallet,
    stakeEntryId,
    stakeEntryData?.parsed.stakeMint
  );

  transaction.add(
    unstake(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: stakeEntryId,
      originalMintId: params.originalMintId,
      user: wallet.publicKey,
      stakeEntryOriginalMintTokenAccount: stakeEntryOriginalMintTokenAccountId,
      userOriginalMintTokenAccount: userOriginalMintTokenAccountId,
      remainingAccounts,
    })
  );

  // claim any rewards deserved
  if (rewardDistributorData) {
    await withClaimRewards(transaction, connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: stakeEntryId,
      lastStaker: wallet.publicKey,
      skipRewardMintTokenAccount: params.skipRewardMintTokenAccount,
    });
  }

  return transaction;
};

export const withUpdateStakePool = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
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
  }
): [Transaction, PublicKey] => {
  transaction.add(
    updateStakePool(connection, wallet, {
      stakePoolId: params.stakePoolId,
      requiresCreators: params.requiresCreators || [],
      requiresCollections: params.requiresCollections || [],
      requiresAuthorization: params.requiresAuthorization || false,
      overlayText: params.overlayText || "STAKED",
      imageUri: params.imageUri || "",
      authority: wallet.publicKey,
      resetOnStake: params.resetOnStake || false,
      cooldownSeconds: params.cooldownSeconds,
      minStakeSeconds: params.minStakeSeconds,
      endDate: params.endDate,
      doubleOrResetEnabled: params.doubleOrResetEnabled,
    })
  );
  return [transaction, params.stakePoolId];
};

export const withUpdateTotalStakeSeconds = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakeEntryId: PublicKey;
    lastStaker: PublicKey;
  }
): Transaction => {
  transaction.add(
    updateTotalStakeSeconds(connection, wallet, {
      stakEntryId: params.stakeEntryId,
      lastStaker: params.lastStaker,
    })
  );
  return transaction;
};

export const withReturnReceiptMint = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakeEntryId: PublicKey;
  }
): Promise<Transaction> => {
  const stakeEntryData = await tryGetAccount(() =>
    getStakeEntry(connection, params.stakeEntryId)
  );
  if (!stakeEntryData) {
    throw new Error(`Stake entry ${params.stakeEntryId.toString()} not found`);
  }

  if (
    !stakeEntryData.parsed.stakeMintClaimed &&
    !stakeEntryData.parsed.originalMintClaimed
  ) {
    console.log("No receipt mint to return");
    return transaction;
  }

  const receiptMint =
    stakeEntryData.parsed.stakeMint && stakeEntryData.parsed.stakeMintClaimed
      ? stakeEntryData.parsed.stakeMint
      : stakeEntryData.parsed.originalMint;

  const tokenManagerId = await tokenManagerAddressFromMint(
    connection,
    receiptMint
  );
  const tokenManagerData = await tryGetAccount(() =>
    tokenManager.accounts.getTokenManager(connection, tokenManagerId)
  );

  if (!tokenManagerData) {
    return transaction;
  }

  const remainingAccountsForReturn = await withRemainingAccountsForReturn(
    transaction,
    connection,
    wallet,
    tokenManagerData
  );

  transaction.add(
    await returnReceiptMint(connection, wallet, {
      stakeEntry: params.stakeEntryId,
      receiptMint: receiptMint,
      tokenManagerKind: tokenManagerData.parsed.kind,
      tokenManagerState: tokenManagerData.parsed.state,
      returnAccounts: remainingAccountsForReturn,
    })
  );
  return transaction;
};

export const withCloseStakePool = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
  }
): Transaction => {
  transaction.add(
    closeStakePool(connection, wallet, {
      stakePoolId: params.stakePoolId,
      authority: wallet.publicKey,
    })
  );
  return transaction;
};

export const withCloseStakeEntry = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
  }
): Transaction => {
  transaction.add(
    closeStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: params.stakeEntryId,
      authority: wallet.publicKey,
    })
  );
  return transaction;
};

export const withReassignStakeEntry = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
    target: PublicKey;
  }
) => {
  transaction.add(
    reassignStakeEntry(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: params.stakeEntryId,
      target: params.target,
    })
  );
  return transaction;
};

export const withDoubleOrResetTotalStakeSeconds = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeEntryId: PublicKey;
  }
): Transaction => {
  transaction.add(
    doubleOrResetTotalStakeSeconds(connection, wallet, {
      stakePoolId: params.stakePoolId,
      stakeEntryId: params.stakeEntryId,
    })
  );
  return transaction;
};

export const withInitStakeBooster = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeBoosterIdentifier?: BN;
    paymentAmount: BN;
    paymentMint: PublicKey;
    boostSeconds: BN;
    startTimeSeconds: number;
    payer?: PublicKey;
  }
): Transaction => {
  transaction.add(
    initStakeBooster(connection, wallet, {
      ...params,
    })
  );
  return transaction;
};

export const withUpdateStakeBooster = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeBoosterIdentifier?: BN;
    paymentAmount: BN;
    paymentMint: PublicKey;
    boostSeconds: BN;
    startTimeSeconds: number;
  }
) => {
  transaction.add(
    updateStakeBooster(connection, wallet, {
      ...params,
    })
  );
  return transaction;
};

export const withCloseStakeBooster = (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeBoosterIdentifier?: BN;
  }
) => {
  transaction.add(
    closeStakeBooster(connection, wallet, {
      ...params,
    })
  );
  return transaction;
};

export const withBoostStakeEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    stakePoolId: PublicKey;
    stakeBoosterIdentifier?: BN;
    stakeEntryId: PublicKey;
    originalMintId: PublicKey;
    payerTokenAccount: PublicKey;
    payer?: PublicKey;
    secondsToBoost: BN;
  }
): Promise<Transaction> => {
  const stakeBoosterId = findStakeBoosterId(
    params.stakePoolId,
    params.stakeBoosterIdentifier
  );

  const stakeBooster = await getStakeBooster(connection, stakeBoosterId);
  const paymentManager = await getPaymentManager(
    connection,
    stakeBooster.parsed.paymentManager
  );
  const feeCollectorTokenAccount = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    stakeBooster.parsed.paymentMint,
    paymentManager.parsed.feeCollector,
    params.payer ?? wallet.publicKey
  );
  const paymentRecipientTokenAccount =
    await withFindOrInitAssociatedTokenAccount(
      transaction,
      connection,
      stakeBooster.parsed.paymentMint,
      stakeBooster.parsed.paymentRecipient,
      params.payer ?? wallet.publicKey
    );
  transaction.add(
    boostStakeEntry(connection, wallet, {
      ...params,
      paymentManager: stakeBooster.parsed.paymentManager,
      paymentRecipientTokenAccount: paymentRecipientTokenAccount,
      originalMintId: params.originalMintId,
      feeCollectorTokenAccount: feeCollectorTokenAccount,
    })
  );
  return transaction;
};

/**
 * Add init group stake entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, public key for the created group stake entry
 */
export const withInitGroupStakeEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupCooldownSeconds?: number;
    groupStakeSeconds?: number;
  }
): Promise<[Transaction, PublicKey]> => {
  const [tx, groupEntryId] = await initGroupStakeEntry(connection, wallet, {
    groupCooldownSeconds: params.groupCooldownSeconds,
    groupStakeSeconds: params.groupStakeSeconds,
  });
  transaction.add(tx);
  return [transaction, groupEntryId];
};

/**
 * Add a stake entry to the group entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, public key for the created group stake entry
 */
export const withAddToGroupEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
    stakeEntryId: PublicKey;
  }
): Promise<[Transaction]> => {
  transaction.add(
    await addToGroupEntry(connection, wallet, {
      groupEntry: params.groupEntryId,
      stakeEntry: params.stakeEntryId,
    })
  );
  return [transaction];
};

/**
 * Remove stake entry from the group entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, public key for the created group stake entry
 */
export const withRemoveFromGroupEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
    stakeEntryId: PublicKey;
  }
): Promise<[Transaction]> => {
  transaction.add(
    await removeFromGroupEntry(connection, wallet, {
      groupEntry: params.groupEntryId,
      stakeEntry: params.stakeEntryId,
    })
  );
  return [transaction];
};

/**
 * Add close group stake entry instructions to a transaction
 * @param transaction
 * @param connection
 * @param wallet
 * @param params
 * @returns Transaction, public key for the created group stake entry
 */
export const withCloseGroupEntry = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
  }
): Promise<[Transaction]> => {
  transaction.add(
    await closeGroupEntry(connection, wallet, {
      groupEntry: params.groupEntryId,
    })
  );
  return [transaction];
};
