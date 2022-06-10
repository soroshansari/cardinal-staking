import type { AccountData } from "@cardinal/common";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import type { RewardEntryData } from "../src/programs/rewardDistributor";
// import type { RewardEntryV0Data } from "../src/programs/rewardDistributor";
import {
  getAllRewardEntries,
  getRewardDistributor,
} from "../src/programs/rewardDistributor/accounts";
import { getAllStakeEntries } from "../src/programs/stakePool/accounts";
// import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { connectionFor } from "./connection";
import { chunkArray } from "./utils";

// crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr
const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.CRANK_SOLANA_KEY || "")
);

const BATCH_SIZE = 1;
const REVERSE = false;

const migrateRewardEntries = async (cluster: string) => {
  const connection = connectionFor(cluster);

  const allRewardEntries = await getAllRewardEntries(connection);
  const allStakeEntries = await getAllStakeEntries(connection);
  const stakeEntryIds = allStakeEntries.map((stakeEntry) =>
    stakeEntry.pubkey.toString()
  );
  // let filteredRewardEntries = allRewardEntries.filter(
  //   (rewardEntry) => !stakeEntryIds.includes(rewardEntry.parsed.mint.toString())
  // );
  let filteredRewardEntries = allRewardEntries;

  console.log(
    `Migrating ${filteredRewardEntries.length} entries in batches of ${BATCH_SIZE}`
  );

  if (REVERSE) {
    filteredRewardEntries = filteredRewardEntries.reverse();
  }
  const chunkedRewardEntries = chunkArray(
    filteredRewardEntries,
    BATCH_SIZE
  ) as AccountData<RewardEntryData>[][];

  for (let i = 0; i < chunkedRewardEntries.length; i++) {
    const rewardEntries = chunkedRewardEntries[i]!;
    console.log(
      `\n\n\n-------- Migrating chunk ${i + 1} of ${
        chunkedRewardEntries.length
      } --------`
    );
    const transaction = new Transaction();
    const entriesInTx: AccountData<RewardEntryData>[] = [];
    for (let j = 0; j < rewardEntries.length; j++) {
      try {
        console.log(
          `-------- Entry ${j + 1}/${rewardEntries.length} of chunk ${i + 1}/${
            chunkedRewardEntries.length
          } --------`
        );
        const rewardEntryData = rewardEntries[j]!;
        const rewardDistributorData = await getRewardDistributor(
          connection,
          rewardEntryData?.parsed.rewardDistributor
        );

        // MINT used to be on the rewardEntry
        const stakeEntryId = rewardEntryData.parsed.stakeEntry;
        // const [stakeEntryId] = await findStakeEntryIdFromMint(
        //   connection,
        //   wallet.publicKey,
        //   rewardDistributorData.parsed.stakePool,
        //   rewardEntryData.parsed.mint
        // );

        console.log("Reward entry before: ", rewardEntryData);
        transaction
          .add
          // await migrateRewardEntry(connection, new SignerWallet(wallet), {
          //   rewardEntryV0Id: rewardEntryData.pubkey,
          //   stakeEntryId: stakeEntryId,
          //   rewardDistributorId: rewardDistributorData.pubkey,
          // })
          ();
        entriesInTx.push(rewardEntryData);
      } catch (e) {
        console.log(e);
      }
    }

    try {
      const txid = await executeTransaction(
        connection,
        new SignerWallet(wallet),
        transaction,
        {}
      );
      console.log(
        `Succesfully migrated entries [${entriesInTx
          .map((e) => e.pubkey.toString())
          .join()}] with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
      );
    } catch (e) {
      console.log(e);
    }
  }
};

migrateRewardEntries("mainnet").catch((e) => console.log(e));
