import * as dotenv from "dotenv";
dotenv.config();

import { BorshAccountsCoder, utils } from "@project-serum/anchor";
import type { Connection } from "@solana/web3.js";

import {
  StakeEntryData,
  STAKE_POOL_ADDRESS,
  STAKE_POOL_IDL,
} from "../src/programs/stakePool";
import { connectionFor } from "./connection";

const CLUSTER = "mainnet-beta";
// const MAX_SIZE = 400;

export const getAllStakeEntries = async (connection: Connection) => {
  const programAccounts = await connection.getProgramAccounts(
    STAKE_POOL_ADDRESS,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: utils.bytes.bs58.encode(
              BorshAccountsCoder.accountDiscriminator("stakeEntry")
            ),
          },
        },
      ],
    }
  );
  return programAccounts;
};

const checkZeros = async (cluster: string) => {
  const connection = connectionFor(cluster);
  const coder = new BorshAccountsCoder(STAKE_POOL_IDL);
  const allStakeEntries = await getAllStakeEntries(connection);
  console.log(
    `--------- Check zeros ${allStakeEntries.length} stake entries ---------`
  );
  const poolCounts: { [poolId: string]: number } = {};
  for (let i = 0; i < allStakeEntries.length; i++) {
    const a = allStakeEntries[i]!;
    try {
      const stakeEntryData: StakeEntryData = coder.decode(
        "stakeEntry",
        a.account.data
      );
      const encoded = await coder.encode("stakeEntry", stakeEntryData);
      if (a.account.data.slice(encoded.length).some((b) => b !== 0)) {
        const poolId = stakeEntryData.pool.toString();
        const c = poolCounts[poolId] ?? 0;
        poolCounts[poolId] = c + 1;
        console.log(
          stakeEntryData.pool.toString(),
          a.pubkey.toString(),
          stakeEntryData
        );
      }
    } catch (e) {
      console.log(`[error] ${a.pubkey.toString()}`, e);
    }
  }
  console.log(poolCounts);
};

checkZeros(CLUSTER).catch((e) => console.log(e));
