import { AnchorProvider, Program } from "@project-serum/anchor";
import type { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import type { AnchorTypes } from "@saberhq/anchor-contrib";
import type { ConfirmOptions, Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

import * as STAKE_POOL_TYPES from "../../idl/cardinal_stake_pool";

export const STAKE_POOL_ADDRESS = new PublicKey(
  "stkBL96RZkjY5ine4TvPihGqW8UHJfch2cokjAPzV8i"
);

export const STAKE_POOL_SEED = "stake-pool";

export const STAKE_ENTRY_SEED = "stake-entry";

export const GROUP_ENTRY_SEED = "group-entry";

export const IDENTIFIER_SEED = "identifier";

export const STAKE_AUTHORIZATION_SEED = "stake-authorization";

export const STAKE_BOOSTER_SEED = "stake-booster";

export const AUTHORITY_OFFSET = 25;
export const STAKER_OFFSET = 82;
export const GROUP_STAKER_OFFSET = 8 + 1 + 32;
export const POOL_OFFSET = 9;

export type STAKE_POOL_PROGRAM = STAKE_POOL_TYPES.CardinalStakePool;

export const STAKE_POOL_IDL = STAKE_POOL_TYPES.IDL;

export type StakePoolTypes = AnchorTypes<STAKE_POOL_PROGRAM>;

type Accounts = StakePoolTypes["Accounts"];
export type StakePoolData = Accounts["stakePool"];
export type StakeEntryData = Accounts["stakeEntry"];
export type GroupStakeEntryData = Accounts["groupStakeEntry"];
export type IdentifierData = Accounts["identifier"];
export type StakeAuthorizationData = Accounts["stakeAuthorizationRecord"];
export type StakeBoosterData = Accounts["stakeBooster"];

export const STAKE_BOOSTER_PAYMENT_MANAGER_NAME = "cardinal-stake-booster";
export const STAKE_BOOSTER_PAYMENT_MANAGER = new PublicKey(
  "CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a" // cardinal-stake-booster
);

export const stakePoolProgram = (
  connection: Connection,
  wallet: Wallet,
  confirmOptions?: ConfirmOptions
) => {
  return new Program<STAKE_POOL_PROGRAM>(
    STAKE_POOL_IDL,
    STAKE_POOL_ADDRESS,
    new AnchorProvider(connection, wallet, confirmOptions ?? {})
  );
};

export enum ReceiptType {
  // Receive the original mint wrapped in a token manager
  Original = 1,
  // Receive a receipt mint wrapped in a token manager
  Receipt = 2,
  // Receive nothing
  None = 3,
}
