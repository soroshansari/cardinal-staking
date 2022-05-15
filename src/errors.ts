import type { SendTransactionError } from "@solana/web3.js";

type ErrorCode = {
  code: string;
  message: string;
};

export const errorsMap: { [key: string]: ErrorCode[] } = {
  // stake pool errors
  stakePool: [
    { code: "6000", message: "Original mint is invalid" },
    { code: "6001", message: "Token Manager mint is invalid" },
    { code: "6002", message: "Invalid user original mint token account" },
    { code: "6003", message: "Invalid user token manager mint account" },
    {
      code: "6004",
      message: "Invalid stake entry original mint token account",
    },
    {
      code: "6005",
      message: "Invalid stake entry token manager mint token account",
    },
    {
      code: "6006",
      message: "Invalid unstake user only last staker can unstake",
    },
    { code: "6007", message: "Invalid stake pool" },
    { code: "6008", message: "No mint metadata" },
    { code: "6009", message: "Mint not allowed in this pool" },
    { code: "6010", message: "Invalid stake pool authority" },
    { code: "6011", message: "Invalid stake type" },
    { code: "6012", message: "Invalid stake entry stake token account" },
    { code: "6013", message: "Invalid last staker" },
    { code: "6014", message: "Invalid token manager program" },
    { code: "6015", message: "Invalid receipt mint" },
    { code: "6016", message: "Stake entry already has tokens staked" },
    { code: "6017", message: "Invalid authority" },
    { code: "6018", message: "Cannot close staked entry" },
    { code: "6019", message: "Cannot close staked entry" },
    {
      code: "6020",
      message: "Token still has some cooldown seconds remaining",
    },
    { code: "6019", message: "Minimum stake seconds not satisfied" },
  ],

  // reward distributor errors
  rewardDistributor: [
    { code: "6000", message: "Invalid token account" },
    { code: "6000", message: "Invalid reward mint" },
    { code: "6000", message: "Invalid user reward mint token account" },
    { code: "6000", message: "Invalid reward distributor" },
    { code: "6000", message: "Invalid reward distributor authority" },
    { code: "6000", message: "Invalid reward distributor kind" },
    { code: "6000", message: "Initial supply required for kind treasury" },
    { code: "6000", message: "Invalid authority" },
    { code: "6000", message: "Invalid distributor for pool" },
    { code: "6000", message: "Distributor is already open" },
    { code: "6000", message: "Distributor is already closed" },
    { code: "6000", message: "Invalid stake entry" },
    { code: "6000", message: "Invalid reward entry" },
  ],

  // native errors
  native: [
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
      message:
        "ConstraintMintDecimals: A mint decimals constraint was violated",
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
  ],
};

export const parseError = (e: any, fallBackMessage: string): string => {
  try {
    const hex = (e as SendTransactionError).message.split(" ").at(-1);
    if (hex) {
      const dec = parseInt(hex, 16);
      const program = "";
      let out = null;
      if (dec < 6000) {
        out = errorsMap["native"]?.find(
          (err) => err.code === dec.toString()
        )?.message;
      } else {
        if (program) {
          out = errorsMap[program]?.find(
            (err) => err.code === dec.toString()
          )?.message;
        } else {
          const stakePoolErr =
            errorsMap["stakePool"]?.find((err) => err.code === dec.toString())
              ?.message ?? "";
          const rewardDistributorErr =
            errorsMap["rewardDistributor"]?.find(
              (err) => err.code === dec.toString()
            )?.message ?? "";
          console.log(stakePoolErr, rewardDistributorErr);
          out =
            stakePoolErr +
            (stakePoolErr && rewardDistributorErr && " or ") +
            rewardDistributorErr;
        }
      }
      return out ?? fallBackMessage;
    }
    return fallBackMessage;
  } catch (e) {
    return fallBackMessage;
  }
};
