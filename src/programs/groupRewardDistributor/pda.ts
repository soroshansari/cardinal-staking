import { utils } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

import {
  GROUP_REWARD_COUNTER_SEED,
  GROUP_REWARD_DISTRIBUTOR_ADDRESS,
  GROUP_REWARD_DISTRIBUTOR_SEED,
  GROUP_REWARD_ENTRY_SEED,
} from "./constants";

/**
 * Finds the group reward entry id.
 * @returns
 */
export const findGroupRewardEntryId = async (
  groupRewardDistributorId: PublicKey,
  groupEntryId: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(GROUP_REWARD_ENTRY_SEED),
      groupRewardDistributorId.toBuffer(),
      groupEntryId.toBuffer(),
    ],
    GROUP_REWARD_DISTRIBUTOR_ADDRESS
  );
};

/**
 * Finds the group reward entry id.
 * @returns
 */
export const findGroupRewardCounterId = async (
  groupRewardDistributorId: PublicKey,
  authority: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [
      utils.bytes.utf8.encode(GROUP_REWARD_COUNTER_SEED),
      groupRewardDistributorId.toBuffer(),
      authority.toBuffer(),
    ],
    GROUP_REWARD_DISTRIBUTOR_ADDRESS
  );
};

/**
 * Finds the group reward distributor id.
 * @returns
 */
export const findGroupRewardDistributorId = async (
  id: PublicKey
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress(
    [utils.bytes.utf8.encode(GROUP_REWARD_DISTRIBUTOR_SEED), id.toBuffer()],
    GROUP_REWARD_DISTRIBUTOR_ADDRESS
  );
};
