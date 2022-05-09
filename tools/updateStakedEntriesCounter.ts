import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import { executeTransaction } from "../src";
import { getAllStakeEntries } from "../src/programs/stakePool/accounts";
import { withUpdateStakedEntriesCounter } from "../src/programs/stakePool/transaction";
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
  console.log(`Updating ${Object.keys(poolsMap).length} pools\n`);
  for (const poolId in poolsMap) {
    const transaction = new Transaction();
    console.log(`Updating pool ${poolId}...`);
    withUpdateStakedEntriesCounter(
      transaction,
      connection,
      new SignerWallet(wallet),
      {
        stakePoolId: new PublicKey(poolId),
        counter: new BN(poolsMap[poolId]!),
      }
    );
    try {
      await executeTransaction(
        connection,
        new SignerWallet(wallet),
        transaction,
        {}
      );
      console.log(`Succesfully updated pool ${poolId}!`);
    } catch (e) {
      console.log(`Error with pool ${poolId}`);
      console.log(e);
      break;
    }
  }
};

main().catch((e) => console.log(e));
