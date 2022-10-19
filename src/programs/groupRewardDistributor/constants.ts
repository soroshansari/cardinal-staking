import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { PublicKey } from "@solana/web3.js";

import * as GROUP_REWARD_DISTRIBUTOR_TYPES from "../../idl/cardinal_group_reward_distributor";

export const GROUP_REWARD_DISTRIBUTOR_ADDRESS = new PublicKey(
  "grwhjR5CEDPHGC6zPGtdGX5GrN9oxTUNDpbDXaGfC28"
);
export const GROUP_REWARD_MANAGER = new PublicKey(
  "crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr"
);

export const GROUP_REWARD_ENTRY_SEED = "group-reward-entry";

export const GROUP_REWARD_COUNTER_SEED = "group-reward-counter";

export const GROUP_REWARD_DISTRIBUTOR_SEED = "group-reward-distributor";

export type GROUP_REWARD_DISTRIBUTOR_PROGRAM =
  GROUP_REWARD_DISTRIBUTOR_TYPES.CardinalGroupRewardDistributor;

export const GROUP_REWARD_DISTRIBUTOR_IDL = GROUP_REWARD_DISTRIBUTOR_TYPES.IDL;

export type GroupRewardDistributorTypes =
  AnchorTypes<GROUP_REWARD_DISTRIBUTOR_PROGRAM>;

type Accounts = GroupRewardDistributorTypes["Accounts"];
export type GroupRewardEntryData = Accounts["groupRewardEntry"];
export type GroupRewardCounterData = Accounts["groupRewardCounter"];
export type GroupRewardDistributorData = Accounts["groupRewardDistributor"];

export enum GroupRewardDistributorKind {
  Mint = 1,
  Treasury = 2,
}

export enum GroupRewardDistributorMetadataKind {
  NoRestriction = 1,
  UniqueNames = 2,
  UniqueSymbols = 3,
}

export enum GroupRewardDistributorPoolKind {
  NoRestriction = 1,
  AllFromSinglePool = 2,
  EachFromSeparatePool = 3,
}
