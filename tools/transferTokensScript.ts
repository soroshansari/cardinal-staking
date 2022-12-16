import { withFindOrInitAssociatedTokenAccount } from "@cardinal/common";
import { utils, Wallet } from "@project-serum/anchor";
import { createTransferCheckedInstruction } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

import { executeTransaction } from "../src";
import { connectionFor } from "./connection";

const wallet = Keypair.fromSecretKey(utils.bytes.bs58.decode("")); // your wallet's secret key
const mint = new PublicKey("");
const rewardDistributorId = new PublicKey("");
const amount = 0;
const decimals = 0;

const main = async () => {
  const connection = connectionFor("mainnet");
  const transaction = new Transaction();

  const ownerAtaId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mint,
    wallet.publicKey,
    wallet.publicKey,
    true
  );

  const rewardDistributorAtaId = await withFindOrInitAssociatedTokenAccount(
    transaction,
    connection,
    mint,
    rewardDistributorId,
    wallet.publicKey,
    true
  );

  transaction.add(
    createTransferCheckedInstruction(
      ownerAtaId,
      mint,
      rewardDistributorAtaId,
      wallet.publicKey,
      amount,
      decimals
    )
  );

  await executeTransaction(connection, new Wallet(wallet), transaction, {});
};

main().catch((e) => console.log(e));
