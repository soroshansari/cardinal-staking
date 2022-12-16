import { tryGetAccount } from "@cardinal/common";
import { utils, Wallet } from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as dotenv from "dotenv";

import { executeTransaction } from "../src";
import { getRewardDistributor } from "../src/programs/rewardDistributor/accounts";
import { findRewardDistributorId } from "../src/programs/rewardDistributor/pda";
import { withClaimRewards } from "../src/programs/rewardDistributor/transaction";
import { getActiveStakeEntriesForPool } from "../src/programs/stakePool/accounts";
import { withUpdateTotalStakeSeconds } from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";
import { chunkArray } from "./utils";

dotenv.config();

const BATCH_SIZE = 4;
const PARALLEL_BATCH_SIZE = 5;

const authorityWallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.WALLET || "SECRET_KEY")
); // your wallet's secret key

const main = async (stakePoolId: PublicKey, cluster = "devnet") => {
  const connection = connectionFor(cluster);

  const rewardDistributorId = findRewardDistributorId(stakePoolId);
  const checkRewardDistributorData = await tryGetAccount(() =>
    getRewardDistributor(connection, rewardDistributorId)
  );
  if (!checkRewardDistributorData) {
    throw "No reward distributor found";
  }

  const activeStakeEntries = await getActiveStakeEntriesForPool(
    connection,
    stakePoolId
  );
  console.log(
    `Estimated SOL needed to claim rewards for ${activeStakeEntries.length} staked tokens:`,
    0.002 * activeStakeEntries.length,
    "SOL"
  );

  const chunkedEntries = chunkArray(activeStakeEntries, BATCH_SIZE);
  const batchedChunks = chunkArray(chunkedEntries, PARALLEL_BATCH_SIZE);

  for (let i = 0; i < batchedChunks.length; i++) {
    const chunk = batchedChunks[i]!;
    console.log(
      `\n\n\n---------------- Chunk ${i + 1} of ${
        batchedChunks.length
      } ----------------`
    );
    await Promise.all(
      chunk.map(async (entries, index) => {
        const transaction = new Transaction();
        for (let j = 0; j < entries.length; j++) {
          const stakeEntryData = entries[j]!;
          withUpdateTotalStakeSeconds(
            transaction,
            connection,
            new Wallet(authorityWallet),
            {
              stakeEntryId: stakeEntryData.pubkey,
              lastStaker: authorityWallet.publicKey,
            }
          );
          await withClaimRewards(
            transaction,
            connection,
            new Wallet(authorityWallet),
            {
              stakePoolId: stakePoolId,
              stakeEntryId: stakeEntryData.pubkey,
              lastStaker: stakeEntryData.parsed.lastStaker,
              payer: authorityWallet.publicKey,
            }
          );
        }
        try {
          if (transaction.instructions.length > 0) {
            const txid = await executeTransaction(
              connection,
              new Wallet(authorityWallet),
              transaction,
              {}
            );
            console.log(
              `[${index + 1}/${
                chunk.length
              }] Succesfully claimed rewards with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
            );
          }
        } catch (e) {
          console.log(e);
        }
      })
    );
  }

  console.log(
    `Successfully claimed rewards for ${activeStakeEntries.length} staked tokens`
  );
};

const stakePoolId = new PublicKey("POOL_ID");
main(stakePoolId, "mainnet").catch((e) => console.log(e));
