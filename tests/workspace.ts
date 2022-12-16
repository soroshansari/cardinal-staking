import * as anchor from "@project-serum/anchor";
import { chaiSolana } from "@saberhq/chai-solana";
import chai from "chai";

chai.use(chaiSolana);

export const getProvider = (): anchor.AnchorProvider => {
  const anchorProvider = anchor.AnchorProvider.env();
  anchor.setProvider(anchorProvider);
  return anchorProvider;
};
