import { tryGetAccount } from "@cardinal/token-manager";
import { utils } from "@project-serum/anchor";
import { SignerWallet } from "@saberhq/solana-contrib";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import { getStakePool } from "../src/programs/stakePool/accounts";
import { withCloseStakePool } from "../src/programs/stakePool/transaction";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(utils.bytes.bs58.decode("SECRET_KEY"));

const main = async (cluster = "mainnet") => {
  const connection = connectionFor(cluster);
  const transaction = new Transaction();
  const stakePoolId = new PublicKey(
    "5pTqPBTBvbueU6PQWcthcyAwKBjcu89GoPRNtD3AKEJZ"
  );

  withCloseStakePool(transaction, connection, new SignerWallet(wallet), {
    stakePoolId: stakePoolId,
  });

  console.log("Closing pool...");
  await executeTransaction(
    connection,
    new SignerWallet(wallet),
    transaction,
    {}
  );

  const pool = await tryGetAccount(() => getStakePool(connection, stakePoolId));
  if (!pool) {
    console.log("Succesfully closed pool");
  } else {
    console.log("Pool didn't close");
  }
};

main().catch((e) => console.log(e));
