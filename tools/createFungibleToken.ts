import {
  CreateMetadataV2,
  DataV2,
  Metadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { utils, Wallet } from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
import {
  Keypair,
  sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";

import { connectionFor } from "./connection";
import { createMintTransaction } from "./utils";

const wallet = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.AIRDROP_KEY || "")
);

const MINT_KEYPAIR = Keypair.fromSecretKey(
  utils.bytes.bs58.decode(process.env.AIRDROP_KEY || "")
);

const SUPPLY = new splToken.u64(60_000_000_0000000);
const DECIMALS = 7;

export const createFungibleToken = async (
  cluster = "devnet",
  mintKeypair: Keypair
) => {
  const connection = connectionFor(cluster);
  try {
    const masterEditionTransaction = new Transaction();
    const [masterEditionTokenAccountId] = await createMintTransaction(
      masterEditionTransaction,
      connection,
      new Wallet(wallet),
      wallet.publicKey,
      mintKeypair.publicKey,
      SUPPLY,
      DECIMALS
    );

    const metadataId = await Metadata.getPDA(mintKeypair.publicKey);
    const metadataTx = new CreateMetadataV2(
      { feePayer: wallet.publicKey },
      {
        metadata: metadataId,
        metadataData: new DataV2({
          name: "",
          symbol: "",
          uri: "",
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        }),
        updateAuthority: wallet.publicKey,
        mint: mintKeypair.publicKey,
        mintAuthority: wallet.publicKey,
      }
    );

    const transaction = new Transaction();
    transaction.instructions = [
      ...masterEditionTransaction.instructions,
      ...metadataTx.instructions,
    ];
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getRecentBlockhash("max")
    ).blockhash;
    transaction.sign(wallet, mintKeypair);
    const txid = await sendAndConfirmRawTransaction(
      connection,
      transaction.serialize(),
      {
        commitment: "confirmed",
      }
    );
    console.log(
      `Token created mintId=(${mintKeypair.publicKey.toString()}) metadataId=(${metadataId.toString()}) tokenAccount=(${masterEditionTokenAccountId.toString()}) with transaction https://explorer.solana.com/tx/${txid}?cluster=${cluster}`
    );
  } catch (e) {
    console.log("Failed", e);
  }
};

createFungibleToken("mainnet", MINT_KEYPAIR).catch((e) => {
  console.log(e);
});
