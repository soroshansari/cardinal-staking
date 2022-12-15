import * as dotenv from "dotenv";

dotenv.config();
import { PublicKey } from "@solana/web3.js";
import { getActiveStakeEntriesForPool } from "../src/programs/stakePool/accounts";
import { connectionFor } from "./connection";
import { BN } from "bn.js";

const POOL_ID = new PublicKey("3BZCupFU6X3wYJwgTsKS2vTs4VeMrhSZgx4P2TfzExtP");

export const stakedTokensBreakdownByWallet = async (cluster = "devnet") => {
  const connection = connectionFor(cluster);
  const UTCNow = Date.now() / 1000;
  const stakeEntries = await getActiveStakeEntriesForPool(connection, POOL_ID);

  const results = stakeEntries.reduce(
    (acc, stakeEntry) => {
      const wallet = stakeEntry.parsed.lastStaker.toString();
      const currentEntry = {
        wallet,
        totalStakeAmount: stakeEntry.parsed.amount.toNumber(),
        totalStakeSeconds: stakeEntry.parsed.totalStakeSeconds
          .add(
            new BN(UTCNow).sub(
              stakeEntry.parsed.lastUpdatedAt ?? stakeEntry.parsed.lastStakedAt
            )
          )
          .toNumber(),
      };
      const existingEntry = acc[wallet];
      if (existingEntry) {
        acc[wallet] = {
          wallet,
          totalStakeAmount:
            existingEntry.totalStakeAmount + currentEntry.totalStakeAmount,
          totalStakeSeconds:
            existingEntry.totalStakeSeconds + currentEntry.totalStakeSeconds,
        };
      } else {
        acc[wallet] = currentEntry;
      }
      return acc;
    },
    {} as {
      [wallet: string]: {
        wallet: string;
        totalStakeAmount: number;
        totalStakeSeconds: number;
      };
    }
  );

  const sortedResults = Object.values(results).sort(
    (a, b) => b.totalStakeSeconds - a.totalStakeSeconds
  );
  console.log(sortedResults);
};

stakedTokensBreakdownByWallet("mainnet").catch((e) => {
  console.log(e);
});
