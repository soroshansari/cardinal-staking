import { tryGetAccount } from "@cardinal/common";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import { executeTransaction } from "../src";
import {
  getRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import {
  findRewardDistributorId,
  findRewardEntryId,
} from "../src/programs/rewardDistributor/pda";
import {
  withInitRewardEntry,
  withUpdateRewardEntry,
} from "../src/programs/rewardDistributor/transaction";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryId } from "../src/programs/stakePool/pda";
import { withInitStakeEntry } from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";
import type { Metadata } from "./getMetadataForPoolTokens";
import { fetchMetadata } from "./getMetadataForPoolTokens";
import type { UpdateRule } from "./updateMultipliersOnRules";
import { chunkArray } from "./utils";

const wallet = Keypair.fromSecretKey(utils.bytes.bs58.decode("SECRET_KEY"));

const POOL_ID = new PublicKey("POOL_ID");
const CLUSTER = "mainnet";
const FUNGIBLE = false;
const BATCH_SIZE = 2;

type EntryData = { mintId: PublicKey; multiplier?: number };

// REMINDER: Take into account rewardDistributor.multiplierDecimals!
const MINT_LIST: EntryData[] = [
  {
    mintId: new PublicKey("MINT_ID"),
    multiplier: 2,
  },
  // ...
  // ...
];
const metadataRules: UpdateRule = {
  metadata: [{ traitType: "trait_type", value: "value", multiplier: 2 }],
};

const initializeEntries = async (
  stakePoolId: PublicKey,
  entries: EntryData[],
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
      entries.length
    } entries for pool (${stakePoolId.toString()}) and reward distributor (${rewardDistributorId.toString()}) ---------`
  );
  const chunkedEntries = chunkArray(entries, BATCH_SIZE) as EntryData[][];

  for (let i = 0; i < chunkedEntries.length; i++) {
    const entries = chunkedEntries[i]!;
    console.log(
      `\n\n\n-------- Migrating chunk ${i + 1} of ${
        chunkedEntries.length
      } --------`
    );

    let metadata: Metadata[] = [];
    if (metadataRules.metadata) {
      const temp = await fetchMetadata(
        connection,
        entries.map((entry) => entry.mintId)
      );
      metadata = temp[0];
    }
    const transaction = new Transaction();
    const entriesInTx: EntryData[] = [];
    for (let j = 0; j < entries.length; j++) {
      const { mintId, multiplier } = entries[j]!;
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
        }

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

        let multiplierToSet = multiplier;
        if (metadataRules.metadata) {
          const md = metadata[j]!;
          for (const rule of metadataRules.metadata) {
            console.log(md.attributes);
            if (
              md.attributes.find(
                (attr) =>
                  attr.trait_type === rule.traitType &&
                  attr.value === rule.value
              )
            ) {
              multiplierToSet = rule.multiplier;
            }
          }
        }
        console.log(mintId.toString(), multiplierToSet);

        if (
          multiplierToSet &&
          rewardEntry?.parsed.multiplier.toNumber() !== multiplierToSet
        ) {
          console.log(
            `3. Updating reward entry multipler from  ${
              rewardEntry?.parsed.multiplier.toNumber() || 0
            } => ${multiplierToSet}`
          );
          multiplierToSet =
            multiplierToSet **
            (10 ** rewardDistributorData.parsed.multiplierDecimals); // adjust for decimals
          await withUpdateRewardEntry(
            transaction,
            connection,
            new SignerWallet(wallet),
            {
              stakePoolId,
              stakeEntryId,
              rewardDistributorId,
              multiplier: new BN(multiplierToSet),
            }
          );
        }
      } catch (e: unknown) {
        console.log(`Failed to add entry IXs for mint (${mintId.toString()})`);
      }
    }

    try {
      if (transaction.instructions.length > 0) {
        const txid = await executeTransaction(
          connection,
          new SignerWallet(wallet),
          transaction,
          {}
        );
        console.log(
          `Succesfully created/updated entries [${entriesInTx
            .map((e) => e.mintId.toString())
            .join()}] with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
};

initializeEntries(POOL_ID, MINT_LIST, CLUSTER, FUNGIBLE).catch((e) =>
  console.log(e)
);
