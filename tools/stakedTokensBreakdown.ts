import {
  getActiveStakeEntriesForPool,
  getAllStakePools,
} from "../src/programs/stakePool/accounts";
import { delay } from "../tests/utils";
import { connectionFor } from "./connection";

export const stakedTokensBreakdown = async (cluster = "devnet") => {
  const connection = connectionFor(cluster);

  const stats: { poolId: string; total: number }[] = [];
  const stakePools = await getAllStakePools(connection);
  let counter = 0;
  for (const pool of stakePools) {
    const stakedTokens = await getActiveStakeEntriesForPool(
      connection,
      pool.pubkey
    );
    stats.push({ poolId: pool.pubkey.toString(), total: stakedTokens.length });
    counter += 1;
    console.log(`${counter}/${stakePools.length}`);
    await delay(1000);
  }

  console.log(stats.sort((a, b) => (a.total < b.total ? 1 : -1)));
};

stakedTokensBreakdown("mainnet").catch((e) => {
  console.log(e);
});
