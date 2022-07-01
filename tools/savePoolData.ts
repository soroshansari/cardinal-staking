import { BorshAccountsCoder } from "@project-serum/anchor";

import { STAKE_POOL_IDL } from "../src/programs/stakePool";
import { getAllStakePools } from "../src/programs/stakePool/accounts";
import { connectionFor } from "./connection";

const CLUSTER = "mainnet";

const savePoolData = async (cluster: string) => {
  const connection = connectionFor(cluster);
  const allStakePools = await getAllStakePools(connection);
  console.log(`--------- Printing ${allStakePools.length} pools ---------`);
  allStakePools.map((p, i) => {
    // console.log(
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   `${i}:${p.pubkey.toString()}:${Array.apply([], p.account.data).join(",")}`
    // );
    console.log(`${i}:${p.pubkey.toString()}:`, p.parsed);
  });
};

savePoolData(CLUSTER).catch((e) => console.log(e));

const getOverflowedPoolsData = async (cluster: string) => {
  const connection = connectionFor(cluster);
  const allStakePools = await getAllStakePools(connection);
  console.log(`--------- Reading ${allStakePools.length} pools ---------`);

  const coder = new BorshAccountsCoder(STAKE_POOL_IDL);
  for (let i = 0; i < allStakePools.length; i++) {
    const p = allStakePools[i]!;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const allBytes = Array.apply([], p.account.data);
    const encoded = await coder.encode("stakePool", p.parsed);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const deserializedBytes = Array.apply([], encoded);
    const extraBytes = allBytes.slice(deserializedBytes.length);
    if (extraBytes.some((b) => b !== 0)) {
      console.log(`\n${i}:${p.pubkey.toString()}:${allBytes.join(",")}`);
      console.log(`${i}:${p.pubkey.toString()}:${deserializedBytes.join(",")}`);
      console.log(`${i}:${p.pubkey.toString()}:${extraBytes.join(",")}`);
    }
  }
};

getOverflowedPoolsData(CLUSTER).catch((e) => console.log(e));
