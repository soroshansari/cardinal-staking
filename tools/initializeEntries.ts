import { tryGetAccount } from "@cardinal/common";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import {
  getRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import {
  findRewardDistributorId,
  findRewardEntryId,
} from "../src/programs/rewardDistributor/pda";
import { withInitRewardEntry } from "../src/programs/rewardDistributor/transaction";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryId } from "../src/programs/stakePool/pda";
import { withInitStakeEntry } from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(utils.bytes.bs58.decode(""));
const POOL_ID = new PublicKey("POOL_ID");
const MINT_IDS = [new PublicKey("MINT_IDS")];
const CLUSTER = "mainnet";

const initializeEntries = async (
  stakePoolId: PublicKey,
  mintIds: PublicKey[],
  cluster: string,
  fungible = false
) => {
  const connection = connectionFor(cluster);
  const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
  const rewardDistributorData = await getRewardDistributor(
    connection,
    rewardDistributorId
  );
  console.log(
    `--------- Initialize ${
      mintIds.length
    } entries for pool (${stakePoolId.toString()}) and reward distributor (${rewardDistributorId.toString()}) ---------`
  );
  for (let i = 0; i < mintIds.length; i++) {
    const mintId = mintIds[i]!;
    console.log(
      `\n\n--------- Initializing entries for mint (${mintId.toString()}) ---------`
    );
    try {
      const [stakeEntryId] = await findStakeEntryId(
        wallet.publicKey,
        stakePoolId,
        mintId,
        fungible
      );
      const stakeEntry = await tryGetAccount(() =>
        getStakeEntry(connection, stakeEntryId)
      );

      if (!stakeEntry) {
        const transaction = new Transaction();
        await withInitStakeEntry(
          transaction,
          connection,
          new SignerWallet(wallet),
          {
            stakePoolId,
            originalMintId: mintId,
          }
        );
        console.log("1. Adding stake entry instruction");
        const [rewardEntryId] = await findRewardEntryId(
          rewardDistributorId,
          stakeEntryId
        );
        const rewardEntry = await tryGetAccount(() =>
          getRewardEntry(connection, rewardEntryId)
        );
        if (rewardDistributorData && !rewardEntry) {
          console.log(
            "2. reward entry not found for reward distributor - adding reward entry instruction"
          );
          await withInitRewardEntry(
            transaction,
            connection,
            new SignerWallet(wallet),
            {
              stakeEntryId,
              rewardDistributorId,
            }
          );
        }
        const txid = await executeTransaction(
          connection,
          new SignerWallet(wallet),
          transaction,
          {}
        );
        console.log(
          `Succesfully initialized entries for (${mintId.toString()}) with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
        );
      } else {
        console.log(`Stake entry for mint (${mintId.toString()}) alrady found`);
      }
    } catch (e) {
      console.log(
        `Failed to initialize entries for mint (${mintId.toString()})`
      );
    }
  }
};

initializeEntries(POOL_ID, MINT_IDS, CLUSTER).catch((e) => console.log(e));
