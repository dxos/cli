# WNS CLI

## Account Setup

Registering records in WNS requires an account. To create an account, activate the required profile and run the following command:

```bash
$ wire wns account create
? Post a Tweet with text 'Fund cosmos1jeh4d8ym99t235p22n6j4lyyf9wk56jgzjq9dk' and paste the URL: "<PASTE TWEET URL HERE>"
Requesting funds from faucet...
Got funds from faucet:
[
  {
    "type": "uwire",
    "quantity": 1000000000
  }
]
Creating a bond...
Bond created successfully.
Account created successfully. Copy the mnemonic to another safe location.
There is no way to recover the account and associated funds if this mnemonic is lost.
{
  "mnemonic": "rely lounge lock never tuition relax ostrich depth clever pill clap express",
  "privateKey": "87bb801596815239cc79c0e62f76d0f94a0c6be25e9cfcc13f7297ed01db3794",
  "publicKey": "02c65789582ad62e527e1fcd1d267aad79864dd2e8bfbb19bce90997fe630aa3ac",
  "address": "cosmos1jeh4d8ym99t235p22n6j4lyyf9wk56jgzjq9dk",
  "bondId": "0b73fdcbbf7033c51c405cbcb4498ddcf1a9c6b6d17873e22db34f39e3f3ca3c"
}
Mnemonic saved to ~/.wire/profile/devnet.secrets.yml
```

The profile configuration file is automatically updated with the WNS account private key and bond.

## Gas and Fees

https://docs.cosmos.network/master/basics/gas-fees.html

* Transactions require `gas`, set to the maximum value the transaction is allowed to consume.
* Typically, validators also require transaction `fees` to be provided to allow the transaction into the mempool.

The `gas` and `fees` can be set to some default values in the profile, and can be overriden for each command using the `--gas` and `--fees` arguments.

Example:

```bash
$ wns bond create --type uwire --quantity 1000000000 --gas 200000 --fees 200000uwire
```

## Operations

These commands require `wire` CLI to be configured, and a profile to be active.

Get node status:

```bash
$ wire wns status
{
  "version": "0.3.0",
  "node": {
    "id": "f31006c3c9c56a3fc118661110c16a00eaef3635",
    "network": "wireline",
    "moniker": "Ashwins-MacBook-Pro-2.local"
  },
  "sync": {
    "latest_block_hash": "E2A7DF2DB9184EA505B78BEF84CE457AA349762ABA25E612CFF282926A5BA827",
    "latest_block_height": "3",
    "latest_block_time": "2020-04-07 10:34:42.702299 +0000 UTC",
    "catching_up": false
  },
  "validator": {
    "address": "258A5BA35D399BAD5D7129B95784A43167536AF4",
    "voting_power": "10000000"
  },
  "validators": [
    {
      "address": "258A5BA35D399BAD5D7129B95784A43167536AF4",
      "voting_power": "10000000",
      "proposer_priority": "0"
    }
  ],
  "num_peers": "0",
  "peers": [],
  "disk_usage": "124K"
}
```

Create account (automatically requests faucet funds, creates a bond and updates profile config):

```bash
$ wire wns account create
```

Get account details:

```bash
$ wire wns account get --address cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094
[
  {
    "address": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "pubKey": "61rphyEC6tEq0pxTI2Sy97VlWCSZhA/PRaUfFlQjhQcpYfTfYtg=",
    "number": "0",
    "sequence": "2",
    "balance": [
      {
        "type": "uwire",
        "quantity": "89990000000000"
      }
    ]
  }
]
```

Request funds from faucet:

```bash
$ wire faucet request --post-url "<TWEET URL>"
{
  "requestTokens": {
    "status": true,
    "error": null,
    "tokens": [
      {
        "type": "uwire",
        "quantity": 1000000000
      }
    ]
  }
}
```

Send tokens:

```bash
$ wire wns tokens send --address cosmos1w5q7xy9sk8hqvlklftdfdkc3kgsd90cxlkwvty --type uwire --quantity 1000000000
[
  {
    "address": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "pubKey": "61rphyEC6tEq0pxTI2Sy97VlWCSZhA/PRaUfFlQjhQcpYfTfYtg=",
    "number": "0",
    "sequence": "3",
    "balance": [
      {
        "type": "uwire",
        "quantity": "89989000000000"
      }
    ]
  },
  {
    "address": "cosmos1w5q7xy9sk8hqvlklftdfdkc3kgsd90cxlkwvty",
    "pubKey": null,
    "number": "7",
    "sequence": "0",
    "balance": [
      {
        "type": "uwire",
        "quantity": "1000000000"
      }
    ]
  }
]
```

Create record (generic):

```yaml
# bot.yml
record:
  name: Chess Bot
  type: bot
  version: 1.0.0
  protocol:
    /: QmbQiRpLX5djUsfc2yDswHvTkHTGd9uQEy6oUJfxkBYwRq
  package:
    linux:
      x64:
        /: QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA
      arm:
        /: QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg
    macos:
      x64:
        /: QmXogCVZZ867qZfS3CYjYdDEziPb4ARiDfgwqbd7urVKkr
```

Publish record (see below for commands to create/query bonds):

```bash
$ wire wns record publish --filename bot.yml
```

Get record:

```bash
$ wire wns record get --id bafyreihvapkvblaiwuwsehluyfmxnuovot2bdyihr755wux4bnvotcb36e
[
  {
    "id": "bafyreihvapkvblaiwuwsehluyfmxnuovot2bdyihr755wux4bnvotcb36e",
    "names": [],
    "owners": [
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "createTime": "2020-08-07T11:14:30.148029000",
    "expiryTime": "2021-08-07T11:14:30.148029000",
    "attributes": {
      "name": "Chess Bot",
      "package": {
        "linux": {
          "arm": {
            "/": "QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg"
          },
          "x64": {
            "/": "QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA"
          }
        },
        "macos": {
          "x64": {
            "/": "QmXogCVZZ867qZfS3CYjYdDEziPb4ARiDfgwqbd7urVKkr"
          }
        }
      },
      "protocol": {
        "/": "QmbQiRpLX5djUsfc2yDswHvTkHTGd9uQEy6oUJfxkBYwRq"
      },
      "type": "bot",
      "version": "1.0.0"
    }
  }
]
```

List records:

```bash
$ wire wns record list
```

Reserve authority:

```bash
$ wire wns authority reserve dxos
{
  "hash": "DADF18AF6F11457572CE2AC419CA65F0824012FC409E3E9B964DD0FDE59DD506",
  "height": 169,
  "data": "dxos",
  "log": [
    {
      "msg_index": 0,
      "success": true,
      "log": ""
    }
  ],
  "gasWanted": "200000",
  "gasUsed": "35532",
  "events": [
    {
      "type": "message",
      "attributes": [
        {
          "key": "action",
          "value": "reserve-authority"
        }
      ]
    }
  ]
}
```

Check authority information:

```bash
$ wire wns authority whois dxos
{
  "meta": {
    "height": "179"
  },
  "records": [
    {
      "ownerAddress": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
      "ownerPublicKey": "61rphyEC6tEq0pxTI2Sy97VlWCSZhA/PRaUfFlQjhQcpYfTfYtg=",
      "height": "169"
    }
  ]
}
```

Set name:

```bash
$ wire wns name set wrn://dxos/bot/chess bafyreihvapkvblaiwuwsehluyfmxnuovot2bdyihr755wux4bnvotcb36e
{
  "hash": "D80ED581A784C97EF852AFE2FD5EB7A13A9CC234422A2175FF213387F65EBA32",
  "height": 201,
  "data": "wrn://dxos/bot/chess",
  "log": [
    {
      "msg_index": 0,
      "success": true,
      "log": ""
    }
  ],
  "gasWanted": "200000",
  "gasUsed": "40335",
  "events": [
    {
      "type": "message",
      "attributes": [
        {
          "key": "action",
          "value": "set-name"
        }
      ]
    }
  ]
}
```

Lookup name information:

```bash
$ wire wns name lookup wrn://dxos/bot/chess
{
  "meta": {
    "height": "212"
  },
  "records": [
    {
      "latest": {
        "id": "bafyreihvapkvblaiwuwsehluyfmxnuovot2bdyihr755wux4bnvotcb36e",
        "height": "201"
      }
    }
  ]
}
```

Resolve name:

```bash
$ wire wns name resolve wrn://dxos/bot/chess
{
  "meta": {
    "height": "234"
  },
  "records": [
    {
      "id": "bafyreihvapkvblaiwuwsehluyfmxnuovot2bdyihr755wux4bnvotcb36e",
      "names": [
        "wrn://dxos/bot/chess"
      ],
      "owners": [
        "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
      ],
      "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
      "createTime": "2020-08-07T11:14:30.148029000",
      "expiryTime": "2021-08-07T11:14:30.148029000",
      "attributes": {
        "name": "Chess Bot",
        "package": {
          "linux": {
            "arm": {
              "/": "QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg"
            },
            "x64": {
              "/": "QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA"
            }
          },
          "macos": {
            "x64": {
              "/": "QmXogCVZZ867qZfS3CYjYdDEziPb4ARiDfgwqbd7urVKkr"
            }
          }
        },
        "protocol": {
          "/": "QmbQiRpLX5djUsfc2yDswHvTkHTGd9uQEy6oUJfxkBYwRq"
        },
        "type": "bot",
        "version": "1.0.0"
      }
    }
  ]
}
```

Delete name:

```bash
$ wire wns name delete wrn://dxos/bot/chess
{
  "hash": "98270DC01026E6A02E708ECD0699C1FD0233E280A7B9631EFB57BFB21577145B",
  "height": 244,
  "data": "wrn://dxos/bot/chess",
  "log": [
    {
      "msg_index": 0,
      "success": true,
      "log": ""
    }
  ],
  "gasWanted": "200000",
  "gasUsed": "40479",
  "events": [
    {
      "type": "message",
      "attributes": [
        {
          "key": "action",
          "value": "delete-name"
        }
      ]
    }
  ]
}

$ wire wns name resolve wrn://dxos/bot/chess
{
  "meta": {
    "height": "254"
  },
  "records": [
    null
  ]
}
```

Create bond:

```bash
$ wire wns bond create --type uwire --quantity 1000
```

List bonds:

```bash
$ wire wns bond list
[
  {
    "id": "288425db041a7dff6e06e966067625479ae80b29d4c36f9360634eb0cbe2961d",
    "owner": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "balance": [
      {
        "type": "uwire",
        "quantity": "1000"
      }
    ]
  },
  {
    "id": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "owner": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "balance": [
      {
        "type": "uwire",
        "quantity": "9999000000"
      }
    ]
  }
]
```

Get bond:

```bash
$ wire wns bond get --id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3
[
  {
    "id": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "owner": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "balance": [
      {
        "type": "uwire",
        "quantity": "9999000000"
      }
    ]
  }
]
```

Query bonds by owner:

```bash
$ wire wns bond list --owner cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094
[
  {
    "id": "288425db041a7dff6e06e966067625479ae80b29d4c36f9360634eb0cbe2961d",
    "owner": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "balance": [
      {
        "type": "uwire",
        "quantity": "1000"
      }
    ]
  },
  {
    "id": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "owner": "cosmos1wh8vvd0ymc5nt37h29z8kk2g2ays45ct2qu094",
    "balance": [
      {
        "type": "uwire",
        "quantity": "9999000000"
      }
    ]
  }
]
```

Refill bond:

```bash
$ wire wns bond refill --id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3 --type uwire --quantity 1000
```

Withdraw funds from bond:

```bash
$ wire wns bond withdraw --id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3 --type uwire --quantity 500
```

Cancel bond:

```bash
$ wire wns bond cancel --id 288425db041a7dff6e06e966067625479ae80b29d4c36f9360634eb0cbe2961d
```

Associate bond (with record):

```bash
$ wire wns bond associate --id QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz --bond-id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3
```

Disassociate bond (from record):

```bash
$ wire wns bond dissociate --id QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz
```

Dissociate all records from bond:

```bash
$ wire wns bond records dissociate --bond-id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3
```

Reassociate records (switch bond):

```bash
$ wire wns bond records reassociate --old-bond-id 8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3 --new-bond-id 146b5ed7a2771ae2e6b323f334f1c2d1134fd7917eb72dea9c88457e912785ab
```

Run arbitrary query:

```bash
$ wire wns query '{ getStatus { version }}'
```

For more complex query:

```bash
$ echo 'query ($refs: [String!]) { resolveRecords(refs: $refs) { id type name version }}' | wire wns query --variables='{ "refs": ["wrn:bot:dxos.org/echo"] }'
```

Read query from file:

```bash
$ wire wns query --filename='<file_with_query>' --variables='{ "refs": ["wrn:bot:dxos.org/echo"] }'
```
