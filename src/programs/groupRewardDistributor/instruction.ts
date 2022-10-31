import type { BN } from "@project-serum/anchor";
import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Wallet } from "@saberhq/solana-contrib";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { AccountMeta, Connection, PublicKey } from "@solana/web3.js";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";

import type { GROUP_REWARD_DISTRIBUTOR_PROGRAM } from ".";
import {
  GROUP_REWARD_DISTRIBUTOR_ADDRESS,
  GROUP_REWARD_DISTRIBUTOR_IDL,
} from ".";
import type {
  GroupRewardDistributorMetadataKind,
  GroupRewardDistributorPoolKind,
} from "./constants";
import { GROUP_REWARD_MANAGER, GroupRewardDistributorKind } from "./constants";
import { findGroupRewardDistributorId } from "./pda";
import { withRemainingAccountsForRewardKind } from "./utils";

const getProgram = (connection: Connection, wallet: Wallet) => {
  const provider = new AnchorProvider(connection, wallet, {});
  const rewardDistributorProgram =
    new Program<GROUP_REWARD_DISTRIBUTOR_PROGRAM>(
      GROUP_REWARD_DISTRIBUTOR_IDL,
      GROUP_REWARD_DISTRIBUTOR_ADDRESS,
      provider
    );
  return rewardDistributorProgram;
};

export const initGroupRewardDistributor = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    authorizedPools: PublicKey[];
    rewardMintId: PublicKey;
    rewardAmount: BN;
    rewardDurationSeconds: BN;
    rewardKind: GroupRewardDistributorKind;
    poolKind: GroupRewardDistributorPoolKind;
    metadataKind: GroupRewardDistributorMetadataKind;
    maxSupply?: BN;
    supply?: BN;
    defaultMultiplier?: BN;
    multiplierDecimals?: number;
    groupDaysMultiplier?: BN;
    groupDaysMultiplierDecimals?: number;
    groupCountMultiplier?: BN;
    groupCountMultiplierDecimals?: number;
    maxRewardSecondsReceived?: BN;
    minGroupSize?: number;
  }
): Promise<[Transaction, PublicKey, Keypair[]]> => {
  const program = getProgram(connection, wallet);
  const signers: Keypair[] = [];
  const id = Keypair.generate();
  signers.push(id);

  const [groupRewardDistributorId] = await findGroupRewardDistributorId(
    id.publicKey
  );

  const transaction = new Transaction();

  const remainingAccountsForKind = await withRemainingAccountsForRewardKind(
    transaction,
    connection,
    wallet,
    groupRewardDistributorId,
    params.rewardKind || GroupRewardDistributorKind.Mint,
    params.rewardMintId
  );

  const instruction = await program.methods
    .initGroupRewardDistributor({
      id: id.publicKey,
      rewardAmount: params.rewardAmount,
      rewardDurationSeconds: params.rewardDurationSeconds,
      maxSupply: params.maxSupply || null,
      supply: params.supply || null,
      rewardKind: params.rewardKind as never,
      poolKind: params.poolKind as never,
      metadataKind: params.metadataKind as never,
      defaultMultiplier: params.defaultMultiplier || null,
      multiplierDecimals: params.multiplierDecimals || null,
      groupDaysMultiplier: params.groupDaysMultiplier || null,
      groupDaysMultiplierDecimals: params.groupDaysMultiplierDecimals || null,
      groupCountMultiplier: params.groupCountMultiplier || null,
      groupCountMultiplierDecimals: params.groupCountMultiplierDecimals || null,
      maxRewardSecondsReceived: params.maxRewardSecondsReceived || null,
      authorizedPools: params.authorizedPools,
      minGroupSize: params.minGroupSize || null,
    })
    .accounts({
      groupRewardDistributor: groupRewardDistributorId,
      rewardMint: params.rewardMintId,
      authority: wallet.publicKey,
      payer: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccountsForKind)
    .instruction();

  instruction.keys
    .filter((k) => k.pubkey.equals(id.publicKey))
    .map((k) => (k.isSigner = true));

  transaction.add(instruction);
  return [transaction, groupRewardDistributorId, signers];
};

export const initGroupRewardCounter = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardCounterId: PublicKey;
    groupRewardDistributorId: PublicKey;
    authority?: PublicKey;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .initGroupRewardCounter()
    .accounts({
      groupRewardCounter: params.groupRewardCounterId,
      groupRewardDistributor: params.groupRewardDistributorId,
      authority: params.authority,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
};

export const initGroupRewardEntry = (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
    groupRewardDistributorId: PublicKey;
    groupRewardEntryId: PublicKey;
    groupRewardCounterId: PublicKey;
    authority?: PublicKey;
    stakeEntries: {
      stakeEntryId: PublicKey;
      originalMint: PublicKey;
      originalMintMetadata: PublicKey;
    }[];
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);
  const remainingAccounts: AccountMeta[] = [];
  params.stakeEntries.forEach(
    ({ stakeEntryId, originalMint, originalMintMetadata }) => {
      remainingAccounts.push(
        {
          pubkey: stakeEntryId,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: originalMint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: originalMintMetadata,
          isSigner: false,
          isWritable: false,
        }
      );
    }
  );

  return program.methods
    .initGroupRewardEntry()
    .accounts({
      groupEntry: params.groupEntryId,
      groupRewardDistributor: params.groupRewardDistributorId,
      groupRewardEntry: params.groupRewardEntryId,
      groupRewardCounter: params.groupRewardCounterId,
      authority: params.authority ?? wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .transaction();
};

export const claimGroupRewards = (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
    groupRewardEntryId: PublicKey;
    groupRewardDistributorId: PublicKey;
    groupRewardCounterId: PublicKey;
    rewardMintId: PublicKey;
    userRewardMintTokenAccount: PublicKey;
    remainingAccountsForKind: AccountMeta[];
    authority?: PublicKey;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .claimGroupRewards()
    .accounts({
      groupEntry: params.groupEntryId,
      groupRewardEntry: params.groupRewardEntryId,
      groupRewardDistributor: params.groupRewardDistributorId,
      groupRewardCounter: params.groupRewardCounterId,
      rewardMint: params.rewardMintId,
      userRewardMintTokenAccount: params.userRewardMintTokenAccount,
      rewardManager: GROUP_REWARD_MANAGER,
      authority: params.authority ?? wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(params.remainingAccountsForKind)
    .transaction();
};

export const closeGroupRewardDistributor = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    rewardMintId: PublicKey;
    remainingAccountsForKind: AccountMeta[];
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .closeGroupRewardDistributor()
    .accounts({
      groupRewardDistributor: params.groupRewardDistributorId,
      rewardMint: params.rewardMintId,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(params.remainingAccountsForKind)
    .transaction();
};

export const updateGroupRewardEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupRewardEntryId: PublicKey;
    multiplier: BN;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .updateGroupRewardEntry({
      multiplier: params.multiplier,
    })
    .accounts({
      groupRewardDistributor: params.groupRewardDistributorId,
      groupRewardEntry: params.groupRewardEntryId,
      authority: wallet.publicKey,
    })
    .transaction();
};

export const closeGroupRewardEntry = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupEntryId: PublicKey;
    groupRewardEntryId: PublicKey;
    groupRewardDistributorId: PublicKey;
    groupRewardCounterId: PublicKey;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .closeGroupRewardEntry()
    .accounts({
      groupEntry: params.groupEntryId,
      groupRewardEntry: params.groupRewardEntryId,
      authority: wallet.publicKey,
      groupRewardDistributor: params.groupRewardDistributorId,
      groupRewardCounter: params.groupRewardCounterId,
    })
    .transaction();
};

export const closeGroupRewardCounter = async (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardCounterId: PublicKey;
    groupRewardDistributorId: PublicKey;
    authority?: PublicKey;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .closeGroupRewardCounter()
    .accounts({
      groupRewardCounter: params.groupRewardCounterId,
      groupRewardDistributor: params.groupRewardDistributorId,
      authority: params.authority,
    })
    .transaction();
};

export const updateGroupRewardDistributor = (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    authorizedPools: PublicKey[];
    rewardMintId: PublicKey;
    rewardAmount: BN;
    rewardDurationSeconds: BN;
    poolKind: GroupRewardDistributorPoolKind;
    metadataKind: GroupRewardDistributorMetadataKind;
    maxSupply?: BN;
    defaultMultiplier?: BN;
    multiplierDecimals?: number;
    groupDaysMultiplier?: BN;
    groupDaysMultiplierDecimals?: number;
    groupCountMultiplier?: BN;
    groupCountMultiplierDecimals?: number;
    maxRewardSecondsReceived?: BN;
    minGroupSize?: number;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .updateGroupRewardDistributor({
      rewardAmount: params.rewardAmount,
      rewardDurationSeconds: params.rewardDurationSeconds,
      maxSupply: params.maxSupply || null,
      poolKind: params.poolKind as never,
      metadataKind: params.metadataKind as never,
      defaultMultiplier: params.defaultMultiplier || null,
      multiplierDecimals: params.multiplierDecimals || null,
      groupDaysMultiplier: params.groupDaysMultiplier || null,
      groupDaysMultiplierDecimals: params.groupDaysMultiplierDecimals || null,
      groupCountMultiplier: params.groupCountMultiplier || null,
      groupCountMultiplierDecimals: params.groupCountMultiplierDecimals || null,
      maxRewardSecondsReceived: params.maxRewardSecondsReceived || null,
      authorizedPools: params.authorizedPools,
      minGroupSize: params.minGroupSize || null,
    })
    .accounts({
      groupRewardDistributor: params.groupRewardDistributorId,
      authority: wallet.publicKey,
    })
    .transaction();
};

export const reclaimGroupFunds = (
  connection: Connection,
  wallet: Wallet,
  params: {
    groupRewardDistributorId: PublicKey;
    groupRewardDistributorTokenAccountId: PublicKey;
    authorityTokenAccountId: PublicKey;
    authority: PublicKey;
    amount: BN;
  }
): Promise<Transaction> => {
  const program = getProgram(connection, wallet);

  return program.methods
    .reclaimGroupFunds(params.amount)
    .accounts({
      groupRewardDistributor: params.groupRewardDistributorId,
      groupRewardDistributorTokenAccount:
        params.groupRewardDistributorTokenAccountId,
      authorityTokenAccount: params.authorityTokenAccountId,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();
};
