import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import {
  getAllV0RewardEntries,
  getRewardDistributor,
} from "../src/programs/rewardDistributor/accounts";
import {
  fixRewardEntry,
  migrateRewardEntry,
} from "../src/programs/rewardDistributor/instruction";
import { findRewardEntryId } from "../src/programs/rewardDistributor/pda";
import { STAKE_POOL_ADDRESS } from "../src/programs/stakePool";
import { getAllStakeEntries } from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";

const networkURLs: { [key: string]: string } = {
  ["mainnet-beta"]:
    "https://solana-api.syndica.io/access-token/V8plLDeUb6CirggrG585VAwEMT03zJuOnJUQInf6txxozYLFYqcl0EZVyU0CnQHL/",
  mainnet:
    "https://solana-api.syndica.io/access-token/V8plLDeUb6CirggrG585VAwEMT03zJuOnJUQInf6txxozYLFYqcl0EZVyU0CnQHL/",
  devnet: "https://api.devnet.solana.com/",
  testnet: "https://api.testnet.solana.com/",
  localnet: "http://localhost:8899/",
};

// crkdpVWjHWdggGgBuSyAqSmZUmAjYLzD435tcLDRLXr
const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.CRANK_SOLANA_KEY || "")
);

export const connectionFor = (cluster: string, defaultCluster = "mainnet") => {
  return new Connection(
    process.env.RPC_URL || networkURLs[cluster || defaultCluster] || "",
    "recent"
  );
};

const migrateRewardEntries = async (cluster: string) => {
  const connection = connectionFor(cluster);

  const allRewardEntries = await getAllV0RewardEntries(connection);
  const allStakeEntries = await getAllStakeEntries(connection);

  console.log(`Migrating ${allRewardEntries.length} entries`);
  for (let i = 0; i < allRewardEntries.length; i++) {
    try {
      console.log(
        `Migrating reward entry ${i + 1} of ${allRewardEntries.length}`
      );
      const rewardEntryData = allRewardEntries[i]!;
      const rewardDistributorData = await getRewardDistributor(
        connection,
        rewardEntryData?.parsed.rewardDistributor
      );

      if (rewardEntryData.parsed.mint.equals(PublicKey.default)) {
        let stakeEntryId;
        for (let i = 0; i < allStakeEntries.length; i++) {
          const stakeEntry = allStakeEntries[i]!;
          if (
            rewardEntryData.pubkey.equals(
              (
                await findRewardEntryId(
                  rewardDistributorData.pubkey,
                  stakeEntry.pubkey
                )
              )[0]
            )
          ) {
            stakeEntryId = stakeEntry.pubkey;
          }
        }

        if (stakeEntryId) {
          console.log(
            stakeEntryId,
            rewardEntryData.pubkey.toString(),
            (
              await findRewardEntryId(
                rewardDistributorData.pubkey,
                stakeEntryId
              )
            )[0].toString()
          );
          const transaction = new Transaction();
          transaction.add(
            await fixRewardEntry(connection, new SignerWallet(wallet), {
              stakeEntryId: stakeEntryId,
              rewardDistributorId: rewardDistributorData.pubkey,
            })
          );

          const txid = await executeTransaction(
            connection,
            new SignerWallet(wallet),
            transaction,
            {}
          );
          console.log(
            `Succesfully migrated entry ${rewardEntryData.pubkey.toString()} from mint ${rewardEntryData.parsed.mint.toString()} with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
          );
        } else {
          console.log(
            `Failed to fix entry ${rewardEntryData.pubkey.toString()}`
          );
        }

        continue;
      }

      if (rewardEntryData.parsed.multiplier.toNumber() === 0) {
        console.log(
          rewardEntryData,
          rewardEntryData.parsed.mint.toString(),
          rewardEntryData.parsed.multiplier.toNumber()
        );
      }

      const mintAccountInfo = await connection.getAccountInfo(
        rewardEntryData.parsed.mint
      );
      if (mintAccountInfo?.owner.equals(STAKE_POOL_ADDRESS)) {
        console.log("Skipping already migrated");
        continue;
      }

      const [stakeEntryId] = await findStakeEntryIdFromMint(
        connection,
        wallet.publicKey,
        rewardDistributorData.parsed.stakePool,
        rewardEntryData.parsed.mint
      );

      const transaction = new Transaction();
      transaction.add(
        await migrateRewardEntry(connection, new SignerWallet(wallet), {
          rewardEntryV0Id: rewardEntryData.pubkey,
          stakeEntryId: stakeEntryId,
          rewardDistributorId: rewardDistributorData.pubkey,
        })
      );
      const txid = await executeTransaction(
        connection,
        new SignerWallet(wallet),
        transaction,
        {}
      );
      console.log(
        `Succesfully migrated entry ${rewardEntryData.pubkey.toString()} from mint ${rewardEntryData.parsed.mint.toString()} with transaction ${txid} (https://explorer.solana.com/tx/${txid}?cluster=${cluster})`
      );
    } catch (e) {
      console.log(e);
    }
  }
};

migrateRewardEntries("devnet").catch((e) => console.log(e));
