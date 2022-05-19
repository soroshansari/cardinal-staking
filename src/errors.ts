import type { SendTransactionError } from "@solana/web3.js";

import {
  REWARD_DISTRIBUTOR_ADDRESS,
  REWARD_DISTRIBUTOR_IDL,
} from "./programs/rewardDistributor";
import { STAKE_POOL_ADDRESS, STAKE_POOL_IDL } from "./programs/stakePool";

type ErrorCode = {
  code: string;
  message: string;
};

export const nativeErrors: ErrorCode[] = [
  {
    code: "100",
    message: "InstructionMissing: 8 byte instruction identifier not provided",
  },
  {
    code: "101",
    message:
      "InstructionFallbackNotFound: Fallback functions are not supported",
  },
  {
    code: "102",
    message:
      "InstructionDidNotDeserialize: The program could not deserialize the given instruction",
  },
  {
    code: "103",
    message:
      "InstructionDidNotSerialize: The program could not serialize the given instruction",
  },
  {
    code: "1000",
    message:
      "IdlInstructionStub: The program was compiled without idl instructions",
  },
  {
    code: "1001",
    message:
      "IdlInstructionInvalidProgram: Invalid program given to the IDL instruction",
  },
  { code: "2000", message: "ConstraintMut: A mut constraint was violated" },
  {
    code: "2001",
    message: "ConstraintHasOne: A has one constraint was violated",
  },
  {
    code: "2002",
    message: "ConstraintSigner: A signer constraint as violated",
  },
  { code: "2003", message: "ConstraintRaw: A raw constraint was violated" },
  {
    code: "2004",
    message: "ConstraintOwner: An owner constraint was violated",
  },
  {
    code: "2005",
    message: "ConstraintRentExempt: A rent exemption constraint was violated",
  },
  {
    code: "2006",
    message: "ConstraintSeeds: A seeds constraint was violated",
  },
  {
    code: "2007",
    message: "ConstraintExecutable: An executable constraint was violated",
  },
  {
    code: "2008",
    message: "ConstraintState: A state constraint was violated",
  },
  {
    code: "2009",
    message: "ConstraintAssociated: An associated constraint was violated",
  },
  {
    code: "2010",
    message:
      "ConstraintAssociatedInit: An associated init constraint was violated",
  },
  {
    code: "2011",
    message: "ConstraintClose: A close constraint was violated",
  },
  {
    code: "2012",
    message: "ConstraintAddress: An address constraint was violated",
  },
  {
    code: "2013",
    message: "ConstraintZero: Expected zero account discriminant",
  },
  {
    code: "2014",
    message: "ConstraintTokenMint: A token mint constraint was violated",
  },
  {
    code: "2015",
    message: "ConstraintTokenOwner: A token owner constraint was violated",
  },
  {
    code: "2016",
    message:
      "ConstraintMintMintAuthority: A mint mint authority constraint was violated",
  },
  {
    code: "2017",
    message:
      "ConstraintMintFreezeAuthority: A mint freeze authority constraint was violated",
  },
  {
    code: "2018",
    message: "ConstraintMintDecimals: A mint decimals constraint was violated",
  },
  {
    code: "2019",
    message: "ConstraintSpace: A space constraint was violated",
  },
  {
    code: "3000",
    message:
      "AccountDiscriminatorAlreadySet: The account discriminator was already set on this account",
  },
  {
    code: "3001",
    message:
      "AccountDiscriminatorNotFound: No 8 byte discriminator was found on the account",
  },
  {
    code: "3002",
    message:
      "AccountDiscriminatorMismatch: 8 byte discriminator did not match what was expected",
  },
  {
    code: "3003",
    message: "AccountDidNotDeserialize: Failed to deserialize the account",
  },
  {
    code: "3004",
    message: "AccountDidNotSerialize: Failed to serialize the account",
  },
  {
    code: "3005",
    message:
      "AccountNotEnoughKeys: Not enough account keys given to the instruction",
  },
  {
    code: "3006",
    message: "AccountNotMutable: The given account is not mutable",
  },
  {
    code: "3007",
    message:
      "AccountNotProgramOwned: The given account is not owned by the executing program",
  },
  {
    code: "3008",
    message: "InvalidProgramId: Program ID was not as expected",
  },
  {
    code: "3009",
    message: "InvalidProgramExecutable: Program account is not executable",
  },
  {
    code: "3010",
    message: "AccountNotSigner: The given account did not sign",
  },
  {
    code: "3011",
    message:
      "AccountNotSystemOwned: The given account is not owned by the system program",
  },
  {
    code: "3012",
    message:
      "AccountNotInitialized: The program expected this account to be already initialized",
  },
  {
    code: "3013",
    message:
      "AccountNotProgramData: The given account is not a program data account",
  },
  {
    code: "3014",
    message:
      "AccountNotAssociatedTokenAccount: The given account is not the associated token account",
  },
  {
    code: "4000",
    message:
      "StateInvalidAddress: The given state account does not have the correct address",
  },
  {
    code: "5000",
    message:
      "Deprecated: The API being used is deprecated and should no longer be used",
  },
];

export const handleError = (
  e: any,
  fallBackMessage = "Transaction failed"
): string => {
  const hex = (e as SendTransactionError).message.split(" ").at(-1);
  if (hex) {
    const dec = parseInt(hex, 16);
    if (dec < 6000) {
      return (
        nativeErrors.find((err) => err.code === dec.toString())?.message ||
        fallBackMessage
      );
    } else {
      const stakePoolErr = STAKE_POOL_IDL.errors.find(
        (err) => err.code === dec
      );
      const rewardDistributorErr = REWARD_DISTRIBUTOR_IDL.errors.find(
        (err) => err.code === dec
      );
      let stakePoolProgram = false;
      let rewardDistributorProgram = false;
      const logs = (e as SendTransactionError).logs;
      if (logs) {
        stakePoolProgram = logs[0]!.includes(STAKE_POOL_ADDRESS.toString());
        rewardDistributorProgram = logs[0]!.includes(
          REWARD_DISTRIBUTOR_ADDRESS.toString()
        );
      }
      if (stakePoolProgram && stakePoolErr) {
        return "Stake Pool Error: " + stakePoolErr.msg;
      } else if (rewardDistributorProgram && rewardDistributorErr) {
        return "Reward Distributor Error: " + rewardDistributorErr.msg;
      } else {
        return fallBackMessage;
      }
    }
  }
  return fallBackMessage;
};
