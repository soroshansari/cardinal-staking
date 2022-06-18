import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "bn.js";

import { executeTransaction } from "../src";
import { withReclaimFunds } from "../src/programs/rewardDistributor/transaction";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode("ENTER_SECRET_KEY")
); // your wallet's secret key

const main = async (
  stakePoolId: PublicKey,
  amount: number,
  cluster = "devnet"
) => {
  const connection = connectionFor(cluster);
  const transaction = new Transaction();
  console.log(
    `Reclaiming ${amount} tokens from reward distributor of stake pool ${stakePoolId.toString()}`
  );

  await withReclaimFunds(transaction, connection, new SignerWallet(wallet), {
    stakePoolId: stakePoolId,
    amount: new BN(amount),
  });

  await executeTransaction(
    connection,
    new SignerWallet(wallet),
    transaction,
    {}
  );

  console.log("Successfully reclaimed funds");
};

const stakePoolId = new PublicKey("STAKE POOL ID");
const amount = 0;
main(stakePoolId, amount).catch((e) => console.log(e));
