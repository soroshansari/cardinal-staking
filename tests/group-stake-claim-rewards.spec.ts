import { findAta } from "@cardinal/common";
import { expectTXTable } from "@saberhq/chai-solana";
import {
  SignerWallet,
  SolanaProvider,
  TransactionEnvelope,
} from "@saberhq/solana-contrib";
import type * as splToken from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect } from "chai";

import {
  claimGroupRewards,
  closeGroupEntry,
  createGroupEntry,
  createGroupRewardDistributor,
  createStakePool,
  initializeRewardEntry,
  stake,
  unstake,
} from "../src";
import {
  getGroupRewardDistributor,
  getGroupRewardEntry,
} from "../src/programs/groupRewardDistributor/accounts";
import { findGroupRewardEntryId } from "../src/programs/groupRewardDistributor/pda";
import {
  getRewardDistributor,
  getRewardEntry,
} from "../src/programs/rewardDistributor/accounts";
import {
  findRewardDistributorId,
  findRewardEntryId,
} from "../src/programs/rewardDistributor/pda";
import { withInitRewardDistributor } from "../src/programs/rewardDistributor/transaction";
import { ReceiptType } from "../src/programs/stakePool";
import {
  getGroupStakeEntry,
  getStakeEntry,
} from "../src/programs/stakePool/accounts";
import { findStakeEntryIdFromMint } from "../src/programs/stakePool/utils";
import { createMasterEditionIxs, createMint, delay } from "./utils";
import { getProvider } from "./workspace";

// reward distributor with mint youre are not authority

describe("Group stake and claim rewards", () => {
  let originalMintTokenAccountId: PublicKey;
  let originalMint: splToken.Token;
  let originalMint2TokenAccountId: PublicKey;
  let originalMint2: splToken.Token;
  let rewardMint: splToken.Token;
  let groupRewardMint: splToken.Token;
  let stakePoolId: PublicKey;
  let groupRewardDistributorId: PublicKey;
  let groupStakeEntryId: PublicKey;
  const originalMintAuthority = Keypair.generate();

  before(async () => {
    const provider = getProvider();
    // original mint
    [originalMintTokenAccountId, originalMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      1,
      originalMintAuthority.publicKey
    );

    // original mint master edition
    const ixs = await createMasterEditionIxs(
      originalMint.publicKey,
      originalMintAuthority.publicKey
    );
    const txEnvelope = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(originalMintAuthority),
        opts: provider.opts,
      }),
      ixs
    );
    await expectTXTable(txEnvelope, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    // original mint 2
    [originalMint2TokenAccountId, originalMint2] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      1,
      originalMintAuthority.publicKey
    );

    // original mint 2 master edition
    const ixs2 = await createMasterEditionIxs(
      originalMint2.publicKey,
      originalMintAuthority.publicKey
    );
    const txEnvelope2 = new TransactionEnvelope(
      SolanaProvider.init({
        connection: provider.connection,
        wallet: new SignerWallet(originalMintAuthority),
        opts: provider.opts,
      }),
      ixs2
    );
    await expectTXTable(txEnvelope2, "before", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    // reward mint
    [, rewardMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      0,
      provider.wallet.publicKey,
      provider.wallet.publicKey
    );

    // group reward mint
    [, groupRewardMint] = await createMint(
      provider.connection,
      originalMintAuthority,
      provider.wallet.publicKey,
      0,
      provider.wallet.publicKey,
      provider.wallet.publicKey
    );
  });

  it("Create Pool", async () => {
    const provider = getProvider();

    let transaction: Transaction;
    [transaction, stakePoolId] = await createStakePool(
      provider.connection,
      provider.wallet,
      {}
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...transaction.instructions,
      ]),
      "Create pool"
    ).to.be.fulfilled;
  });

  it("Create Reward Distributor", async () => {
    const provider = getProvider();
    const transaction = new Transaction();

    await withInitRewardDistributor(
      transaction,
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        rewardMintId: rewardMint.publicKey,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const rewardDistributorData = await getRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      rewardMint.publicKey.toString()
    );
  });

  it("Create Group Reward Distributor", async () => {
    const provider = getProvider();

    const [transaction, rewardDistributorId] =
      await createGroupRewardDistributor(provider.connection, provider.wallet, {
        authorizedPools: [stakePoolId],
        rewardMintId: groupRewardMint.publicKey,
      });

    groupRewardDistributorId = rewardDistributorId;

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create group reward distributor", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const rewardDistributorData = await getGroupRewardDistributor(
      provider.connection,
      rewardDistributorId
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      groupRewardMint.publicKey.toString()
    );

    expect(rewardDistributorData.parsed.rewardMint.toString()).to.eq(
      groupRewardMint.publicKey.toString()
    );
  });

  it("Create Reward Entry", async () => {
    const provider = getProvider();

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const transaction = await initializeRewardEntry(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint.publicKey,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardEntryId] = await findRewardEntryId(
      rewardDistributorId,
      stakeEntryId
    );

    const rewardEntryData = await getRewardEntry(
      provider.connection,
      rewardEntryId
    );

    expect(rewardEntryData.parsed.rewardDistributor.toString()).to.eq(
      rewardDistributorId.toString()
    );

    expect(rewardEntryData.parsed.stakeEntry.toString()).to.eq(
      stakeEntryId.toString()
    );
  });

  it("Create Reward Entry 2", async () => {
    const provider = getProvider();

    const [rewardDistributorId] = await findRewardDistributorId(stakePoolId);
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint2.publicKey
    );

    const transaction = await initializeRewardEntry(
      provider.connection,
      provider.wallet,
      {
        stakePoolId: stakePoolId,
        originalMintId: originalMint2.publicKey,
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const [rewardEntryId] = await findRewardEntryId(
      rewardDistributorId,
      stakeEntryId
    );

    const rewardEntryData = await getRewardEntry(
      provider.connection,
      rewardEntryId
    );

    expect(rewardEntryData.parsed.rewardDistributor.toString()).to.eq(
      rewardDistributorId.toString()
    );

    expect(rewardEntryData.parsed.stakeEntry.toString()).to.eq(
      stakeEntryId.toString()
    );
  });

  it("Stake", async () => {
    const provider = getProvider();

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await stake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
            userOriginalMintTokenAccountId: originalMintTokenAccountId,
            receiptType: ReceiptType.Original,
          })
        ).instructions,
      ]),
      "Stake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint.publicKey
        )
      )[0]
    );

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );

    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Stake2", async () => {
    const provider = getProvider();

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await stake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint2.publicKey,
            userOriginalMintTokenAccountId: originalMint2TokenAccountId,
            receiptType: ReceiptType.Original,
          })
        ).instructions,
      ]),
      "Stake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint2.publicKey
        )
      )[0]
    );

    const userOriginalMintTokenAccountId = await findAta(
      originalMint2.publicKey,
      provider.wallet.publicKey,
      true
    );

    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.be.greaterThan(0);
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      provider.wallet.publicKey.toString()
    );

    const checkUserOriginalTokenAccount = await originalMint2.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(true);
  });

  it("Create Group Stake Entry", async () => {
    const provider = getProvider();

    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const [stakeEntryId2] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint2.publicKey
    );

    const [transaction, groupEntryId] = await createGroupEntry(
      provider.connection,
      provider.wallet,
      {
        stakeEntryIds: [stakeEntryId, stakeEntryId2],
      }
    );
    groupStakeEntryId = groupEntryId;

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Create reward entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const groupStakeEntryData = await getGroupStakeEntry(
      provider.connection,
      groupEntryId
    );

    expect(groupStakeEntryData.parsed.stakeEntries.length).to.eq(2);

    for (const id of [stakeEntryId, stakeEntryId2]) {
      const stakeEntry = await getStakeEntry(provider.connection, id);
      expect(stakeEntry.parsed.grouped).to.eq(true);
    }
  });

  it("Claim Group Rewards", async () => {
    await delay(2000);
    const provider = getProvider();
    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );
    const [stakeEntryId2] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint2.publicKey
    );
    const oldGroupStakeEntryData = await getGroupStakeEntry(
      provider.connection,
      groupStakeEntryId
    );
    const [groupRewardEntryId] = await findGroupRewardEntryId(
      groupRewardDistributorId,
      groupStakeEntryId
    );

    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await claimGroupRewards(provider.connection, provider.wallet, {
            groupRewardDistributorId,
            groupEntryId: groupStakeEntryId,
            stakeEntryIds: [stakeEntryId, stakeEntryId2],
          })
        )[0].instructions,
      ]),
      "Claim Group Rewards"
    ).to.be.fulfilled;

    const newGroupStakeEntryData = await getGroupStakeEntry(
      provider.connection,
      groupStakeEntryId
    );
    const groupRewardEntryData = await getGroupRewardEntry(
      provider.connection,
      groupRewardEntryId
    );

    expect(newGroupStakeEntryData.parsed.changedAt.toNumber()).to.eq(
      oldGroupStakeEntryData.parsed.changedAt.toNumber()
    );
    expect(
      groupRewardEntryData.parsed.rewardSecondsReceived.toNumber()
    ).greaterThan(1);

    const userGroupRewardMintTokenAccountId = await findAta(
      groupRewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserRewardTokenAccount = await groupRewardMint.getAccountInfo(
      userGroupRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);
  });

  it("Close group", async () => {
    const provider = getProvider();

    const [stakeEntryId] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint.publicKey
    );

    const [stakeEntryId2] = await findStakeEntryIdFromMint(
      provider.connection,
      provider.wallet.publicKey,
      stakePoolId,
      originalMint2.publicKey
    );

    const [transaction] = await closeGroupEntry(
      provider.connection,
      provider.wallet,
      {
        groupEntryId: groupStakeEntryId,
        groupRewardDistributorId,
        stakeEntryIds: [stakeEntryId, stakeEntryId2],
      }
    );

    const txEnvelope = new TransactionEnvelope(SolanaProvider.init(provider), [
      ...transaction.instructions,
    ]);

    await expectTXTable(txEnvelope, "Close group entry", {
      verbosity: "error",
      formatLogs: true,
    }).to.be.fulfilled;

    const userGroupRewardMintTokenAccountId = await findAta(
      groupRewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserRewardTokenAccount = await groupRewardMint.getAccountInfo(
      userGroupRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);

    for (const id of [stakeEntryId, stakeEntryId2]) {
      const stakeEntry = await getStakeEntry(provider.connection, id);
      expect(stakeEntry.parsed.grouped).to.eq(false);
    }
  });

  it("Unstake", async () => {
    const provider = getProvider();
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await unstake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint.publicKey,
          })
        ).instructions,
      ]),
      "Unstake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint.publicKey
        )
      )[0]
    );
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(0);

    const userOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint.publicKey,
      stakeEntryData.pubkey,
      true
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(0);

    const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
      userRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);
  });

  it("Unstake2", async () => {
    const provider = getProvider();
    await expectTXTable(
      new TransactionEnvelope(SolanaProvider.init(provider), [
        ...(
          await unstake(provider.connection, provider.wallet, {
            stakePoolId: stakePoolId,
            originalMintId: originalMint2.publicKey,
          })
        ).instructions,
      ]),
      "Unstake"
    ).to.be.fulfilled;

    const stakeEntryData = await getStakeEntry(
      provider.connection,
      (
        await findStakeEntryIdFromMint(
          provider.connection,
          provider.wallet.publicKey,
          stakePoolId,
          originalMint2.publicKey
        )
      )[0]
    );
    expect(stakeEntryData.parsed.lastStaker.toString()).to.eq(
      PublicKey.default.toString()
    );
    expect(stakeEntryData.parsed.lastStakedAt.toNumber()).to.gt(0);

    const userOriginalMintTokenAccountId = await findAta(
      originalMint2.publicKey,
      provider.wallet.publicKey,
      true
    );
    const checkUserOriginalTokenAccount = await originalMint2.getAccountInfo(
      userOriginalMintTokenAccountId
    );
    expect(checkUserOriginalTokenAccount.amount.toNumber()).to.eq(1);
    expect(checkUserOriginalTokenAccount.isFrozen).to.eq(false);

    const stakeEntryOriginalMintTokenAccountId = await findAta(
      originalMint2.publicKey,
      stakeEntryData.pubkey,
      true
    );

    const userRewardMintTokenAccountId = await findAta(
      rewardMint.publicKey,
      provider.wallet.publicKey,
      true
    );

    const checkStakeEntryOriginalMintTokenAccount =
      await originalMint2.getAccountInfo(stakeEntryOriginalMintTokenAccountId);
    expect(checkStakeEntryOriginalMintTokenAccount.amount.toNumber()).to.eq(0);

    const checkUserRewardTokenAccount = await rewardMint.getAccountInfo(
      userRewardMintTokenAccountId
    );
    expect(checkUserRewardTokenAccount.amount.toNumber()).greaterThan(1);
  });
});
