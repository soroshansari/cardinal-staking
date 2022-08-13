import type { Idl } from "@project-serum/anchor";
import type { PublicKey, SendTransactionError } from "@solana/web3.js";

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
    code: "WalletSignTransactionError",
    message: "User rejected the request.",
  },
  {
    code: "failed to get recent blockhash",
    message:
      "Solana is experiencing degrading performance. You transaction failed to execute.",
  },
  {
    code: "Blockhash not found",
    message:
      "Solana is experiencing degrading performance. Transaction may or may not have gone through.",
  },
  {
    code: "Transaction was not confirmed in",
    message:
      "Transaction timed out waiting on confirmation from Solana. It may or may not have gone through.",
  },
  {
    code: "Attempt to debit an account but found no record of a prior credit",
    message: "Wallet has never had any sol before. Try adding sol first.",
  },
  {
    code: "Provided owner is not allowed",
    message: "Token account is already created for this user",
  },
  {
    code: "not associated with",
    message: "Account not associated with this mint",
  },
  // token program errors
  {
    code: "insufficient funds",
    message:
      "Insufficient funds. User does not have enough balance of token to complete the transaction",
  },
  {
    code: "not ellgible",
    message: "Token is not ellgible for rent",
  },
  // anchor errors
  {
    code: "InstructionMissing",
    message: "InstructionMissing: 8 byte instruction identifier not provided",
  },
  {
    code: "InstructionFallbackNotFound",
    message:
      "InstructionFallbackNotFound: Fallback functions are not supported",
  },
  {
    code: "InstructionDidNotDeserialize",
    message:
      "InstructionDidNotDeserialize: The program could not deserialize the given instruction",
  },
  {
    code: "InstructionDidNotSerialize",
    message:
      "InstructionDidNotSerialize: The program could not serialize the given instruction",
  },
  {
    code: "IdlInstructionStub",
    message:
      "IdlInstructionStub: The program was compiled without idl instructions",
  },
  {
    code: "IdlInstructionInvalidProgram",
    message:
      "IdlInstructionInvalidProgram: Invalid program given to the IDL instruction",
  },
  {
    code: "ConstraintMut",
    message: "ConstraintMut: A mut constraint was violated",
  },
  {
    code: "ConstraintHasOne",
    message: "ConstraintHasOne: A has one constraint was violated",
  },
  {
    code: "ConstraintSigner",
    message: "ConstraintSigner: A signer constraint as violated",
  },
  {
    code: "ConstraintRaw",
    message: "ConstraintRaw: A raw constraint was violated",
  },
  {
    code: "ConstraintOwner",
    message: "ConstraintOwner: An owner constraint was violated",
  },
  {
    code: "ConstraintRentExempt",
    message: "ConstraintRentExempt: A rent exemption constraint was violated",
  },
  {
    code: "ConstraintSeeds",
    message: "ConstraintSeeds: A seeds constraint was violated",
  },
  {
    code: "ConstraintExecutable",
    message: "ConstraintExecutable: An executable constraint was violated",
  },
  {
    code: "ConstraintState",
    message: "ConstraintState: A state constraint was violated",
  },
  {
    code: "ConstraintAssociated",
    message: "ConstraintAssociated: An associated constraint was violated",
  },
  {
    code: "ConstraintAssociatedInit",
    message:
      "ConstraintAssociatedInit: An associated init constraint was violated",
  },
  {
    code: "ConstraintClose",
    message: "ConstraintClose: A close constraint was violated",
  },
  {
    code: "ConstraintAddress",
    message: "ConstraintAddress: An address constraint was violated",
  },
  {
    code: "ConstraintZero",
    message: "ConstraintZero: Expected zero account discriminant",
  },
  {
    code: "ConstraintTokenMint",
    message: "ConstraintTokenMint: A token mint constraint was violated",
  },
  {
    code: "ConstraintTokenOwner",
    message: "ConstraintTokenOwner: A token owner constraint was violated",
  },
  {
    code: "ConstraintMintMintAuthority",
    message:
      "ConstraintMintMintAuthority: A mint mint authority constraint was violated",
  },
  {
    code: "ConstraintMintFreezeAuthority",
    message:
      "ConstraintMintFreezeAuthority: A mint freeze authority constraint was violated",
  },
  {
    code: "ConstraintMintDecimals",
    message: "ConstraintMintDecimals: A mint decimals constraint was violated",
  },
  {
    code: "ConstraintSpace",
    message: "ConstraintSpace: A space constraint was violated",
  },
  {
    code: "AccountDiscriminatorAlreadySet",
    message:
      "AccountDiscriminatorAlreadySet: The account discriminator was already set on this account",
  },
  {
    code: "AccountDiscriminatorNotFound",
    message:
      "AccountDiscriminatorNotFound: No 8 byte discriminator was found on the account",
  },
  {
    code: "AccountDiscriminatorMismatch",
    message:
      "AccountDiscriminatorMismatch: 8 byte discriminator did not match what was expected",
  },
  {
    code: "AccountDidNotDeserialize",
    message: "AccountDidNotDeserialize: Failed to deserialize the account",
  },
  {
    code: "AccountDidNotSerialize",
    message: "AccountDidNotSerialize: Failed to serialize the account",
  },
  {
    code: "30AccountNotEnoughKeys",
    message:
      "AccountNotEnoughKeys: Not enough account keys given to the instruction",
  },
  {
    code: "AccountNotMutable",
    message: "AccountNotMutable: The given account is not mutable",
  },
  {
    code: "AccountNotProgramOwned",
    message:
      "AccountNotProgramOwned: The given account is not owned by the executing program",
  },
  {
    code: "InvalidProgramId",
    message: "InvalidProgramId: Program ID was not as expected",
  },
  {
    code: "InvalidProgramExecutable",
    message: "InvalidProgramExecutable: Program account is not executable",
  },
  {
    code: "AccountNotSigner",
    message: "AccountNotSigner: The given account did not sign",
  },
  {
    code: "AccountNotSystemOwned",
    message:
      "AccountNotSystemOwned: The given account is not owned by the system program",
  },
  {
    code: "AccountNotInitialized",
    message:
      "AccountNotInitialized: The program expected this account to be already initialized",
  },
  {
    code: "AccountNotProgramData",
    message:
      "AccountNotProgramData: The given account is not a program data account",
  },
  {
    code: "AccountNotAssociatedTokenAccount",
    message:
      "AccountNotAssociatedTokenAccount: The given account is not the associated token account",
  },
  {
    code: "StateInvalidAddress",
    message:
      "StateInvalidAddress: The given state account does not have the correct address",
  },
  {
    code: "Deprecated",
    message:
      "Deprecated: The API being used is deprecated and should no longer be used",
  },
].reverse();

export type ErrorOptions = {
  /** ProgramIdls in priority order */
  programIdls?: { idl: Idl; programId: PublicKey }[];
  /** Additional errors by code */
  additionalErrors?: ErrorCode[];
};

export const handleError = (
  e: any,
  fallBackMessage = "Transaction failed",
  // programIdls in priority order
  options: ErrorOptions = {
    programIdls: [
      { programId: STAKE_POOL_ADDRESS, idl: STAKE_POOL_IDL },
      { programId: REWARD_DISTRIBUTOR_ADDRESS, idl: REWARD_DISTRIBUTOR_IDL },
    ],
    additionalErrors: nativeErrors,
  }
): string => {
  const programIdls = options.programIdls ?? [];
  const additionalErrors = options.additionalErrors ?? [];
  const hex = (e as SendTransactionError)?.message?.split(" ").at(-1);
  const dec = parseInt(hex || "", 16);
  const logs =
    (e as SendTransactionError)?.logs ?? [
      (e as SendTransactionError)?.message,
    ] ?? [(e as Error).toString()] ??
    [];

  const matchedErrors: { programMatch?: boolean; errorMatch?: string }[] = [
    ...[
      ...programIdls.map(({ idl, programId }) => ({
        // match program on any log that includes programId and 'failed'
        programMatch: logs?.some(
          (l) => l?.includes(programId.toString()) && l.includes("failed")
        ),
        // match error with decimal
        errorMatch: idl.errors?.find((err) => err.code === dec)?.msg,
      })),
      {
        // match native error with decimal
        errorMatch: additionalErrors.find((err) => err.code === dec.toString())
          ?.message,
      },
    ],
    ...[
      ...programIdls.map(({ idl, programId }) => ({
        // match program on any log that includes programId and 'failed'
        programMatch: logs?.some(
          (l) => l?.includes(programId.toString()) && l.includes("failed")
        ),
        errorMatch: idl.errors?.find(
          (err) =>
            // message includes error
            (e as SendTransactionError)?.message?.includes(
              err.code.toString()
            ) ||
            // toString includes error
            (e as Error).toString().includes(err.code.toString()) ||
            // any log includes error
            (e as SendTransactionError)?.logs?.some((l) =>
              l.toString().includes(err.code.toString())
            )
        )?.msg,
      })),
      {
        errorMatch: additionalErrors.find(
          (err) =>
            // message includes error
            (e as SendTransactionError)?.message?.includes(err.code) ||
            // toString includes error
            (e as Error).toString().includes(err.code) ||
            // any log includes error
            (e as SendTransactionError)?.logs?.some((l) =>
              l.toString().includes(err.code)
            )
        )?.message,
      },
    ],
  ];

  return (
    matchedErrors.find((e) => e.programMatch && e.errorMatch)?.errorMatch ||
    matchedErrors.find((e) => e.errorMatch)?.errorMatch ||
    fallBackMessage
  );
};
