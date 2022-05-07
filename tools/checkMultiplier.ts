import type { AccountData } from "@cardinal/common";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

import type { RewardEntryData } from "../src/programs/rewardDistributor";
import {
  getRewardDistributor,
  getRewardEntriesForRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import { findRewardEntryId } from "../src/programs/rewardDistributor/pda";
import { getStakeEntry } from "../src/programs/stakePool/accounts";
import { findStakeEntryId } from "../src/programs/stakePool/pda";
import { connectionFor } from "./connection";

const checkMultipliers = async (
  rewardDistributorId: PublicKey,
  cluster: string
) => {
  const connection = connectionFor(cluster);
  const rewardEntries = await getRewardEntriesForRewardDistributor(
    connection,
    rewardDistributorId
  );
  const rewardDistributorData = await getRewardDistributor(
    connection,
    rewardDistributorId
  );
  console.log(`--------- Found ${rewardEntries.length} entries ---------`);
  const missingMultipliers: AccountData<RewardEntryData>[] = [];
  rewardEntries.forEach((entry) => {
    if (
      !(
        entry.parsed.multiplier.gte(new BN(8)) &&
        entry.parsed.multiplier.lte(new BN(24))
      )
    ) {
      missingMultipliers.push(entry);
    }
  });
  console.log(`Found ${missingMultipliers.length} entries with multipler=1`);
  console.log(missingMultipliers);
  for (let i = 0; i < missingMultipliers.length; i++) {
    const m = missingMultipliers[i]!;
    console.log(`\n\n${i}. Reward entry: ${m.pubkey.toString()}`);
    console.log(m);
    try {
      const stakeEntry = await getStakeEntry(connection, m.parsed.stakeEntry);
      console.log("  - Multiplier: ", m.parsed.multiplier.toString());
      console.log("  - Stake entry: ", m.parsed.stakeEntry.toString());
      console.log("  - Mint: ", stakeEntry.pubkey.toString());
    } catch (e) {
      const [stakeEntryId] = await findStakeEntryId(
        Keypair.generate().publicKey,
        rewardDistributorData.parsed.stakePool,
        m.parsed.stakeEntry,
        false
      );
      const stakeEntry = await getStakeEntry(connection, stakeEntryId);
      const [rewardEntryId] = await findRewardEntryId(
        rewardDistributorData.pubkey,
        stakeEntryId
      );
      const rewardEntry = await getRewardEntry(connection, rewardEntryId);
      console.log(`  - Reward entry: ${rewardEntryId.toString()}`);
      console.log("  - Multiplier: ", rewardEntry.parsed.multiplier.toString());
      console.log("  - Stake entry: ", stakeEntry.pubkey.toString());
      console.log("  - Migration failed");
    }
  }
};

checkMultipliers(
  new PublicKey("8ZHaYCvFhDs9pz2LS59NzY568sN6UECzpqRCGgoaS1S1"),
  "mainnet"
).catch((e) => console.log(e));
