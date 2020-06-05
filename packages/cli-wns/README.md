# WNS CLI

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

```
# protocol.yml
record:
    type: wrn:protocol
    name: example/chess-protocol
    version: 1.1.1
    displayName: chess-protocol
```

Publish record (see below for commands to create/query bonds):

```bash
$ wire wns record publish --filename protocol.yml
```

Get record:

```bash
$ wire wns record get --id QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz
[
  {
    "id": "QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz",
    "type": "wrn:protocol",
    "name": "example/chess-protocol",
    "version": "1.1.1",
    "owners": [
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "createTime": "2020-04-07T10:38:10.044857000",
    "expiryTime": "2021-04-07T10:38:10.044857000",
    "attributes": {
      "displayName": "chess-protocol",
      "name": "example/chess-protocol",
      "type": "wrn:protocol",
      "version": "1.1.1"
    }
  }
]
```

List records:

```bash
$ wire wns record list
[
  {
    "id": "QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz",
    "type": "wrn:protocol",
    "name": "example/chess-protocol",
    "version": "1.1.1",
    "owners": [
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "createTime": "2020-04-07T10:38:10.044857000",
    "expiryTime": "2021-04-07T10:38:10.044857000",
    "attributes": {
      "displayName": "chess-protocol",
      "name": "example/chess-protocol",
      "type": "wrn:protocol",
      "version": "1.1.1"
    }
  }
]
```

Resolve record by ref:

```bash
$ wire wns record resolve 'wrn:protocol:example/chess-protocol#^1.0.0'
[
    {
        "id": "QmYDtNCKtTu6u6jaHaFAC5PWZXcj7fAmry6NoWwMaixFHz",
        "type": "wrn:protocol",
        "name": "example/chess-protocol",
        "version": "1.1.1",
        "owners": [
            "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
        ],
        "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
        "createTime": "2020-04-07T10:38:10.044857000",
        "expiryTime": "2021-04-07T10:38:10.044857000",
        "attributes": {
            "version": "1.1.1",
            "displayName": "chess-protocol",
            "name": "example/chess-protocol",
            "type": "wrn:protocol"
        }
    }
]
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
$ echo 'query ($refs: [String!]) { resolveRecords(refs: $refs) { id type name version }}' | wire wns query --variables='{ "refs": ["wrn:bot:wireline.io/store"] }'
```

Read query from file:

```bash
$ wire wns query --filename='<file_with_query>' --variables='{ "refs": ["wrn:bot:wireline.io/store"] }'
```
