# Tools

## checkMultiplier.ts

### Params

`cluster`, `rewardDistributorId`

### Usage:

Used to check the multipliers of all the reward entries corresponding to the given reward distibutor

## checkStakeEntry.ts

### Params:

`cluster`, `stakePoolId`, `mintId`

### Usage:

Used to look up and log the stake entry and reward entry for a given mint

## closePools.ts

### Params:

`cluster`, `poolIds`

### Usage:

Used to **safely** close a pool by making sure there are not staked tokens in the pool, closing all stake and reward entries, then closing the reward distributor and then closing the pool. All fund associated with closing the accounts are directed to the `wallet` which is initiating the close.

### Constraint

`wallet` has to match the pool authority for the script to run successfully

## createFungibleToken.ts

### Params:

`cluster`, `mintKeypair`

### Usage:

Handy script to create a fungible token with configurable `SUPPLY` and `DECIMALS`

## initializeEntries.ts

### Params:

`stakePoolId`, `entries`, `cluster`, `fungible`

### Usage:

Given `MINT_LIST`, a list of entries in the format

```
{
    mintId: new PublicKey("MINT_ID"),
    multiplier: 200,
  },
```

the script is used to initialize stake entries and reward entries for a given stake pool. The script allows the functionality of providing **custom multipliers** for given mints, so it can also be used to set multipliers for given mints.
