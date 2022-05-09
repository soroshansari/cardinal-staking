import { tryGetAccount } from "@cardinal/common";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { fail } from "assert";

import { executeTransaction } from "../src";
import {
  getAllRewardEntries,
  getRewardDistributor,
} from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import {
  withCloseRewardDistributor,
  withCloseRewardEntry,
} from "../src/programs/rewardDistributor/transaction";
import {
  getAllStakeEntries,
  getAllStakePools,
} from "../src/programs/stakePool/accounts";
import {
  withCloseStakeEntry,
  withCloseStakePool,
} from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode("ENTER_SECRET_KEY")
); // your wallet's secret key

const pool_skip_list = [""];

const main = async (cluster = "mainnet") => {
  const connection = connectionFor(cluster);

  const stakePools = (await getAllStakePools(connection)).filter(
    (s) =>
      s.parsed.authority.toString() === wallet.publicKey.toString() &&
      !pool_skip_list.includes(s.pubkey.toString())
  );
  const stakeEntries = await getAllStakeEntries(connection);
  const rewardEntries = await getAllRewardEntries(connection);

  for (const stakePool of stakePools) {
    const poolEntries = stakeEntries.filter(
      (s) => s.parsed.pool.toString() === stakePool.pubkey.toString()
    );
    const poolEntriesString = poolEntries.map((s) => s.pubkey.toString());
    const activeStakeEntries = poolEntries.filter(
      (s) => s.parsed.lastStaker.toString() !== PublicKey.default.toString()
    );
    if (cluster !== "devnet") {
      if (activeStakeEntries.length !== 0) {
        console.log(
          "Owners:",
          activeStakeEntries.map((s) => s.parsed.lastStaker.toString())
        );
        throw new Error(
          `Stake pool ${stakePool.pubkey.toString()} has active stake entries`
        );
      }
    }
    console.log(
      `Closing ${
        poolEntries.length
      } stake entries for pool ${stakePool.pubkey.toString()}`
    );
    for (let i = 0; i < poolEntries.length; i++) {
      const entry = poolEntries[i]!;
      const transaction = new Transaction();
      console.log(`Closing ${i + 1} out of ${poolEntries.length} pool entries`);

      try {
        withCloseStakeEntry(transaction, connection, new SignerWallet(wallet), {
          stakePoolId: stakePool.pubkey,
          stakeEntryId: entry.pubkey,
        });
        await executeTransaction(
          connection,
          new SignerWallet(wallet),
          transaction,
          {
            confirmOptions: {
              maxRetries: 3,
            },
          }
        );
      } catch (e) {
        console.log(e);
        fail;
      }
    }

    const poolRewardEntries = rewardEntries.filter((r) =>
      poolEntriesString.includes(r.parsed.stakeEntry.toString())
    );
    console.log(
      `Found ${
        poolRewardEntries.length
      } reward entries for pool ${stakePool.pubkey.toString()}`
    );
    for (let i = 0; i < poolRewardEntries.length; i++) {
      const rewardEntry = poolRewardEntries[i]!;
      const transaction = new Transaction();
      console.log(
        `Closing ${i + 1} out of ${poolRewardEntries.length} reward entries`
      );

      try {
        await withCloseRewardEntry(
          transaction,
          connection,
          new SignerWallet(wallet),
          {
            stakePoolId: stakePool.pubkey,
            stakeEntryId: rewardEntry.parsed.stakeEntry,
          }
        );
        await executeTransaction(
          connection,
          new SignerWallet(wallet),
          transaction,
          {
            confirmOptions: {
              maxRetries: 3,
            },
          }
        );
      } catch (e) {
        console.log(e);
        fail;
      }
    }

    const [rewardDistributorId] = await findRewardDistributorId(
      stakePool.pubkey
    );
    const rewardDistributor = await tryGetAccount(() =>
      getRewardDistributor(connection, rewardDistributorId)
    );
    if (rewardDistributor) {
      const transaction = new Transaction();
      console.log("Closing reward distributor...");
      try {
        await withCloseRewardDistributor(
          transaction,
          connection,
          new SignerWallet(wallet),
          {
            stakePoolId: stakePool.pubkey,
          }
        );
        await executeTransaction(
          connection,
          new SignerWallet(wallet),
          transaction,
          {
            confirmOptions: {
              maxRetries: 3,
            },
          }
        );
        console.log("Successfully closed reward distributor");
      } catch (e) {
        console.log(e);
        fail;
      }
    } else {
      console.log("No reward distributor found");
    }

    console.log("Closing pool");
    const transaction = new Transaction();
    try {
      withCloseStakePool(transaction, connection, new SignerWallet(wallet), {
        stakePoolId: stakePool.pubkey,
      });
      await executeTransaction(
        connection,
        new SignerWallet(wallet),
        transaction,
        {
          confirmOptions: {
            maxRetries: 3,
          },
        }
      );
    } catch (e) {
      console.log(e);
      fail;
    }
  }
};

main("mainnet").catch((e) => console.log(e));
