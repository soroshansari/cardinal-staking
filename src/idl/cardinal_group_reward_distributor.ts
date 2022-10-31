export type CardinalGroupRewardDistributor = {
  version: "1.10.4";
  name: "cardinal_group_reward_distributor";
  instructions: [
    {
      name: "initGroupRewardDistributor";
      accounts: [
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "InitGroupRewardDistributorIx";
          };
        }
      ];
    },
    {
      name: "initGroupRewardEntry";
      accounts: [
        {
          name: "groupRewardEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "claimGroupRewards";
      accounts: [
        {
          name: "groupEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userRewardMintTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateGroupRewardEntry";
      accounts: [
        {
          name: "groupRewardEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: false;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateGroupRewardEntryIx";
          };
        }
      ];
    },
    {
      name: "closeGroupRewardDistributor";
      accounts: [
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "closeGroupRewardEntry";
      accounts: [
        {
          name: "groupRewardEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "updateGroupRewardDistributor";
      accounts: [
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateGroupRewardDistributorIx";
          };
        }
      ];
    },
    {
      name: "reclaimGroupFunds";
      accounts: [
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributorTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authorityTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "initGroupRewardCounter";
      accounts: [
        {
          name: "groupRewardCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "closeGroupRewardCounter";
      accounts: [
        {
          name: "groupRewardCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "groupRewardDistributor";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "groupRewardCounter";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "groupRewardDistributor";
            type: "publicKey";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "count";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "groupRewardEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "groupEntry";
            type: "publicKey";
          },
          {
            name: "groupRewardDistributor";
            type: "publicKey";
          },
          {
            name: "rewardSecondsReceived";
            type: "u128";
          },
          {
            name: "multiplier";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "groupRewardDistributor";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "id";
            type: "publicKey";
          },
          {
            name: "authorizedPools";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "rewardKind";
            type: {
              defined: "GroupRewardDistributorKind";
            };
          },
          {
            name: "metadataKind";
            type: {
              defined: "GroupRewardDistributorMetadataKind";
            };
          },
          {
            name: "poolKind";
            type: {
              defined: "GroupRewardDistributorPoolKind";
            };
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "rewardMint";
            type: "publicKey";
          },
          {
            name: "rewardAmount";
            type: "u64";
          },
          {
            name: "rewardDurationSeconds";
            type: "u128";
          },
          {
            name: "rewardsIssued";
            type: "u128";
          },
          {
            name: "maxSupply";
            type: {
              option: "u64";
            };
          },
          {
            name: "defaultMultiplier";
            type: "u64";
          },
          {
            name: "multiplierDecimals";
            type: "u8";
          },
          {
            name: "maxRewardSecondsReceived";
            type: {
              option: "u128";
            };
          },
          {
            name: "groupDaysMultiplier";
            type: "u64";
          },
          {
            name: "groupDaysMultiplierDecimals";
            type: "u8";
          },
          {
            name: "groupCountMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "groupCountMultiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "minGroupSize";
            type: {
              option: "u8";
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "InitGroupRewardDistributorIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "id";
            type: "publicKey";
          },
          {
            name: "rewardAmount";
            type: "u64";
          },
          {
            name: "rewardDurationSeconds";
            type: "u128";
          },
          {
            name: "rewardKind";
            type: {
              defined: "GroupRewardDistributorKind";
            };
          },
          {
            name: "metadataKind";
            type: {
              defined: "GroupRewardDistributorMetadataKind";
            };
          },
          {
            name: "poolKind";
            type: {
              defined: "GroupRewardDistributorPoolKind";
            };
          },
          {
            name: "authorizedPools";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "supply";
            type: {
              option: "u64";
            };
          },
          {
            name: "maxSupply";
            type: {
              option: "u64";
            };
          },
          {
            name: "defaultMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "multiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "maxRewardSecondsReceived";
            type: {
              option: "u128";
            };
          },
          {
            name: "groupDaysMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "groupDaysMultiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "groupCountMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "groupCountMultiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "minGroupSize";
            type: {
              option: "u8";
            };
          }
        ];
      };
    },
    {
      name: "UpdateGroupRewardDistributorIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "rewardAmount";
            type: "u64";
          },
          {
            name: "rewardDurationSeconds";
            type: "u128";
          },
          {
            name: "metadataKind";
            type: {
              defined: "GroupRewardDistributorMetadataKind";
            };
          },
          {
            name: "poolKind";
            type: {
              defined: "GroupRewardDistributorPoolKind";
            };
          },
          {
            name: "authorizedPools";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "maxSupply";
            type: {
              option: "u64";
            };
          },
          {
            name: "defaultMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "multiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "maxRewardSecondsReceived";
            type: {
              option: "u128";
            };
          },
          {
            name: "groupDaysMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "groupDaysMultiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "groupCountMultiplier";
            type: {
              option: "u64";
            };
          },
          {
            name: "groupCountMultiplierDecimals";
            type: {
              option: "u8";
            };
          },
          {
            name: "minGroupSize";
            type: {
              option: "u8";
            };
          }
        ];
      };
    },
    {
      name: "UpdateGroupRewardEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "multiplier";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "GroupRewardDistributorKind";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Mint";
          },
          {
            name: "Treasury";
          }
        ];
      };
    },
    {
      name: "GroupRewardDistributorMetadataKind";
      type: {
        kind: "enum";
        variants: [
          {
            name: "NoRestriction";
          },
          {
            name: "UniqueNames";
          },
          {
            name: "UniqueSymbols";
          }
        ];
      };
    },
    {
      name: "GroupRewardDistributorPoolKind";
      type: {
        kind: "enum";
        variants: [
          {
            name: "NoRestriction";
          },
          {
            name: "AllFromSinglePool";
          },
          {
            name: "EachFromSeparatePool";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidRewardMint";
      msg: "Invalid reward mint";
    },
    {
      code: 6001;
      name: "InvalidUserRewardMintTokenAccount";
      msg: "Invalid user reward mint token account";
    },
    {
      code: 6002;
      name: "InvalidRewardDistributor";
      msg: "Invalid reward distributor";
    },
    {
      code: 6003;
      name: "InvalidRewardDistributorKind";
      msg: "Invalid reward distributor kind";
    },
    {
      code: 6004;
      name: "SupplyRequired";
      msg: "Initial supply required for kind treasury";
    },
    {
      code: 6005;
      name: "InvalidAuthority";
      msg: "Invalid authority";
    },
    {
      code: 6006;
      name: "InvalidStakeEntry";
      msg: "Invalid stake entry";
    },
    {
      code: 6007;
      name: "InvalidRewardDistributorTokenAccount";
      msg: "Invalid reward distributor token account";
    },
    {
      code: 6008;
      name: "InvalidAuthorityTokenAccount";
      msg: "Invalid authority token account";
    },
    {
      code: 6009;
      name: "InvalidGroupSize";
      msg: "Invalid group size";
    },
    {
      code: 6010;
      name: "InvalidPool";
      msg: "Invalid pool";
    },
    {
      code: 6011;
      name: "InvalidOriginalMint";
      msg: "Original mint is invalid";
    },
    {
      code: 6012;
      name: "InvalidMintMetadata";
      msg: "Invalid mint metadata";
    },
    {
      code: 6013;
      name: "InvalidMintMetadataOwner";
      msg: "Mint metadata is owned by the incorrect program";
    }
  ];
};

export const IDL: CardinalGroupRewardDistributor = {
  version: "1.10.4",
  name: "cardinal_group_reward_distributor",
  instructions: [
    {
      name: "initGroupRewardDistributor",
      accounts: [
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "InitGroupRewardDistributorIx",
          },
        },
      ],
    },
    {
      name: "initGroupRewardEntry",
      accounts: [
        {
          name: "groupRewardEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "claimGroupRewards",
      accounts: [
        {
          name: "groupEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userRewardMintTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateGroupRewardEntry",
      accounts: [
        {
          name: "groupRewardEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: false,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateGroupRewardEntryIx",
          },
        },
      ],
    },
    {
      name: "closeGroupRewardDistributor",
      accounts: [
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "closeGroupRewardEntry",
      accounts: [
        {
          name: "groupRewardEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "updateGroupRewardDistributor",
      accounts: [
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateGroupRewardDistributorIx",
          },
        },
      ],
    },
    {
      name: "reclaimGroupFunds",
      accounts: [
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributorTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authorityTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "initGroupRewardCounter",
      accounts: [
        {
          name: "groupRewardCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "closeGroupRewardCounter",
      accounts: [
        {
          name: "groupRewardCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "groupRewardDistributor",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "groupRewardCounter",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "groupRewardDistributor",
            type: "publicKey",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "count",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "groupRewardEntry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "groupEntry",
            type: "publicKey",
          },
          {
            name: "groupRewardDistributor",
            type: "publicKey",
          },
          {
            name: "rewardSecondsReceived",
            type: "u128",
          },
          {
            name: "multiplier",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "groupRewardDistributor",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "id",
            type: "publicKey",
          },
          {
            name: "authorizedPools",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "rewardKind",
            type: {
              defined: "GroupRewardDistributorKind",
            },
          },
          {
            name: "metadataKind",
            type: {
              defined: "GroupRewardDistributorMetadataKind",
            },
          },
          {
            name: "poolKind",
            type: {
              defined: "GroupRewardDistributorPoolKind",
            },
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "rewardMint",
            type: "publicKey",
          },
          {
            name: "rewardAmount",
            type: "u64",
          },
          {
            name: "rewardDurationSeconds",
            type: "u128",
          },
          {
            name: "rewardsIssued",
            type: "u128",
          },
          {
            name: "maxSupply",
            type: {
              option: "u64",
            },
          },
          {
            name: "defaultMultiplier",
            type: "u64",
          },
          {
            name: "multiplierDecimals",
            type: "u8",
          },
          {
            name: "maxRewardSecondsReceived",
            type: {
              option: "u128",
            },
          },
          {
            name: "groupDaysMultiplier",
            type: "u64",
          },
          {
            name: "groupDaysMultiplierDecimals",
            type: "u8",
          },
          {
            name: "groupCountMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "groupCountMultiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "minGroupSize",
            type: {
              option: "u8",
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "InitGroupRewardDistributorIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "id",
            type: "publicKey",
          },
          {
            name: "rewardAmount",
            type: "u64",
          },
          {
            name: "rewardDurationSeconds",
            type: "u128",
          },
          {
            name: "rewardKind",
            type: {
              defined: "GroupRewardDistributorKind",
            },
          },
          {
            name: "metadataKind",
            type: {
              defined: "GroupRewardDistributorMetadataKind",
            },
          },
          {
            name: "poolKind",
            type: {
              defined: "GroupRewardDistributorPoolKind",
            },
          },
          {
            name: "authorizedPools",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "supply",
            type: {
              option: "u64",
            },
          },
          {
            name: "maxSupply",
            type: {
              option: "u64",
            },
          },
          {
            name: "defaultMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "multiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "maxRewardSecondsReceived",
            type: {
              option: "u128",
            },
          },
          {
            name: "groupDaysMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "groupDaysMultiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "groupCountMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "groupCountMultiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "minGroupSize",
            type: {
              option: "u8",
            },
          },
        ],
      },
    },
    {
      name: "UpdateGroupRewardDistributorIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "rewardAmount",
            type: "u64",
          },
          {
            name: "rewardDurationSeconds",
            type: "u128",
          },
          {
            name: "metadataKind",
            type: {
              defined: "GroupRewardDistributorMetadataKind",
            },
          },
          {
            name: "poolKind",
            type: {
              defined: "GroupRewardDistributorPoolKind",
            },
          },
          {
            name: "authorizedPools",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "maxSupply",
            type: {
              option: "u64",
            },
          },
          {
            name: "defaultMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "multiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "maxRewardSecondsReceived",
            type: {
              option: "u128",
            },
          },
          {
            name: "groupDaysMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "groupDaysMultiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "groupCountMultiplier",
            type: {
              option: "u64",
            },
          },
          {
            name: "groupCountMultiplierDecimals",
            type: {
              option: "u8",
            },
          },
          {
            name: "minGroupSize",
            type: {
              option: "u8",
            },
          },
        ],
      },
    },
    {
      name: "UpdateGroupRewardEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "multiplier",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "GroupRewardDistributorKind",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Mint",
          },
          {
            name: "Treasury",
          },
        ],
      },
    },
    {
      name: "GroupRewardDistributorMetadataKind",
      type: {
        kind: "enum",
        variants: [
          {
            name: "NoRestriction",
          },
          {
            name: "UniqueNames",
          },
          {
            name: "UniqueSymbols",
          },
        ],
      },
    },
    {
      name: "GroupRewardDistributorPoolKind",
      type: {
        kind: "enum",
        variants: [
          {
            name: "NoRestriction",
          },
          {
            name: "AllFromSinglePool",
          },
          {
            name: "EachFromSeparatePool",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidRewardMint",
      msg: "Invalid reward mint",
    },
    {
      code: 6001,
      name: "InvalidUserRewardMintTokenAccount",
      msg: "Invalid user reward mint token account",
    },
    {
      code: 6002,
      name: "InvalidRewardDistributor",
      msg: "Invalid reward distributor",
    },
    {
      code: 6003,
      name: "InvalidRewardDistributorKind",
      msg: "Invalid reward distributor kind",
    },
    {
      code: 6004,
      name: "SupplyRequired",
      msg: "Initial supply required for kind treasury",
    },
    {
      code: 6005,
      name: "InvalidAuthority",
      msg: "Invalid authority",
    },
    {
      code: 6006,
      name: "InvalidStakeEntry",
      msg: "Invalid stake entry",
    },
    {
      code: 6007,
      name: "InvalidRewardDistributorTokenAccount",
      msg: "Invalid reward distributor token account",
    },
    {
      code: 6008,
      name: "InvalidAuthorityTokenAccount",
      msg: "Invalid authority token account",
    },
    {
      code: 6009,
      name: "InvalidGroupSize",
      msg: "Invalid group size",
    },
    {
      code: 6010,
      name: "InvalidPool",
      msg: "Invalid pool",
    },
    {
      code: 6011,
      name: "InvalidOriginalMint",
      msg: "Original mint is invalid",
    },
    {
      code: 6012,
      name: "InvalidMintMetadata",
      msg: "Invalid mint metadata",
    },
    {
      code: 6013,
      name: "InvalidMintMetadataOwner",
      msg: "Mint metadata is owned by the incorrect program",
    },
  ],
};