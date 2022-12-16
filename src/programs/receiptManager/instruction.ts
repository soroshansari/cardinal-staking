import { PAYMENT_MANAGER_ADDRESS } from "@cardinal/payment-manager";
import type { BN } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import type {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";

import {
  RECEIPT_MANAGER_PAYMENT_MANAGER,
  receiptManagerProgram,
} from "./constants";

export const initReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    stakePoolId: PublicKey;
    name: string;
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    paymentMint: PublicKey;
    paymentManager?: PublicKey;
    paymentRecipient: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.initReceiptManager(
    {
      name: params.name,
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManager ?? RECEIPT_MANAGER_PAYMENT_MANAGER,
      paymentRecipient: params.paymentRecipient,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts ?? null,
    },
    {
      accounts: {
        receiptManager: params.receiptManager,
        stakePool: params.stakePoolId,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

export const initReceiptEntry = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(connection, wallet).instruction.initReceiptEntry(
    {
      accounts: {
        receiptEntry: params.receiptEntry,
        stakeEntry: params.stakeEntry,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
    }
  );
};

export const initRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    rewardReceipt: PublicKey;
    receiptManager: PublicKey;
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
    payer: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.initRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      receiptEntry: params.receiptEntry,
      stakeEntry: params.stakeEntry,
      payer: params.payer,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const updateReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    authority: PublicKey;
    requiredStakeSeconds: BN;
    stakeSecondsToUse: BN;
    receiptManager: PublicKey;
    paymentMint: PublicKey;
    paymentManager?: PublicKey;
    paymentRecipient: PublicKey;
    requiresAuthorization: boolean;
    maxClaimedReceipts?: BN;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.updateReceiptManager(
    {
      authority: params.authority,
      requiredStakeSeconds: params.requiredStakeSeconds,
      stakeSecondsToUse: params.stakeSecondsToUse,
      paymentMint: params.paymentMint,
      paymentManager: params.paymentManager ?? RECEIPT_MANAGER_PAYMENT_MANAGER,
      paymentRecipient: params.paymentRecipient,
      requiresAuthorization: params.requiresAuthorization,
      maxClaimedReceipts: params.maxClaimedReceipts ?? null,
    },
    {
      accounts: {
        receiptManager: params.receiptManager,
        authority: wallet.publicKey,
      },
    }
  );
};

export const claimRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
    stakeEntry: PublicKey;
    receiptEntry: PublicKey;
    paymentManager: PublicKey;
    feeCollectorTokenAccount: PublicKey;
    paymentRecipientTokenAccount: PublicKey;
    payerTokenAccount: PublicKey;
    payer: PublicKey;
    claimer: PublicKey;
    initializer: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.claimRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      stakeEntry: params.stakeEntry,
      receiptEntry: params.receiptEntry,
      paymentManager: params.paymentManager,
      feeCollectorTokenAccount: params.feeCollectorTokenAccount,
      paymentRecipientTokenAccount: params.paymentRecipientTokenAccount,
      payerTokenAccount: params.payerTokenAccount,
      payer: params.payer,
      claimer: params.claimer,
      cardinalPaymentManager: PAYMENT_MANAGER_ADDRESS,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    },
  });
};

export const closeReceiptManager = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.closeReceiptManager({
    accounts: {
      receiptManager: params.receiptManager,
      authority: wallet.publicKey,
    },
  });
};

export const closeReceiptEntry = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    receiptEntry: PublicKey;
    stakeEntry: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.closeReceiptEntry({
    accounts: {
      receiptEntry: params.receiptEntry,
      receiptManager: params.receiptManager,
      stakeEntry: params.stakeEntry,
      authority: wallet.publicKey,
    },
  });
};

export const closeRewardReceipt = (
  connection: Connection,
  wallet: Wallet,
  params: {
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.closeRewardReceipt({
    accounts: {
      rewardReceipt: params.rewardReceipt,
      receiptManager: params.receiptManager,
      authority: wallet.publicKey,
    },
  });
};

export const setRewardReceiptAllowed = (
  connection: Connection,
  wallet: Wallet,
  params: {
    auth: boolean;
    receiptManager: PublicKey;
    rewardReceipt: PublicKey;
  }
): TransactionInstruction => {
  return receiptManagerProgram(
    connection,
    wallet
  ).instruction.setRewardReceiptAllowed(params.auth, {
    accounts: {
      receiptManager: params.receiptManager,
      rewardReceipt: params.rewardReceipt,
      authority: wallet.publicKey,
    },
  });
};
