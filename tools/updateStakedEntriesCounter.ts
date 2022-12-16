import { utils, Wallet } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import {
  getAllStakeEntries,
  getStakePool,
} from "../src/programs/stakePool/accounts";
// import { withUpdateStakedEntriesCounter } from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(utils.bytes.bs58.decode("SECRET_KEY"));

const main = async (cluster = "mainnet") => {
  const connection = connectionFor(cluster);
  const stakeEntries = await getAllStakeEntries(connection);
  const poolsMap: { [pool: string]: number } = {};

  for (const entry of stakeEntries) {
    if (entry.parsed.lastStaker.toString() !== PublicKey.default.toString()) {
      const poolId = entry.parsed.pool.toString();
      if (poolId in poolsMap) {
        poolsMap[poolId] += 1;
      } else {
        poolsMap[poolId] = 1;
      }
    }
  }
  console.log(poolsMap);
  console.log(`Updating ${Object.keys(poolsMap).length} pools\n`);
  for (const poolId in poolsMap) {
    try {
      const transaction = new Transaction();
      console.log(`Updating pool ${poolId}...`);
      const stakePoolData = await getStakePool(
        connection,
        new PublicKey(poolId)
      );
      if (stakePoolData.parsed.totalStaked !== 0) {
        continue;
      }
      // withUpdateStakedEntriesCounter(
      //   transaction,
      //   connection,
      //   new Wallet(wallet),
      //   {
      //     stakePoolId: new PublicKey(poolId),
      //     counter: poolsMap[poolId]!,
      //   }
      // );
      await executeTransaction(connection, new Wallet(wallet), transaction, {});
      console.log(`Succesfully updated pool ${poolId}!`);
    } catch (e) {
      console.log(`Error with pool ${poolId}`);
      console.log(e);
      // break;
    }
  }
};

main().catch((e) => console.log(e));
