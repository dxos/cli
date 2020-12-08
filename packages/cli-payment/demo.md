# Payments Demo

Scenario

* Charlie (consumer) pays Dave (provider)
* Each connects to their own payments server (vector node)
* Server nodes talk vector protocol, used to create/resolve micropayments (hashlocked transfers)
* BotFactory protocol enhanced to carry micropayment info

## Setup

### Vector

```bash
$ git clone git@github.com:connext/vector.git
$ cd vector
$ git checkout vector-0.0.25
$ make duet
$ make start-duet
$ make test-duet
```

### CLI Profiles

Profiles: https://gist.github.com/83591bb91c1792c0a0de5a7f2871a583

Download and move the files into the `~/.wire/profile` folder.

### Local Dev Setup

Branches:

* `sdk` => ashwinp-bot-payments
* `cli` => ashwinp-payment-cli
* `yarn link` repos together

Local CLI alias:

```bash
$ alias wire-dev
wire-dev='node ~/projects/dxos/cli/packages/cli/bin/wire.js'
```

## Demo

### CLI Demo

Charlie inspects payment server info, starts interactive terminal:

```bash
$ wire-dev --profile charlie payment server info
{
  "id": "vector8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
  "address": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "balance": "0.0"
}
[wire]>
```

Dave inspects payment server info, starts interactive terminal:

```bash
$ wire-dev --profile dave payment server info
{
  "id": "vector5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
  "address": "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
  "balance": "0.0"
}
[wire]>
```

Fund Charlie's server address using the faucet:

```bash
$ wire-dev --profile faucet payment wallet send 0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832 100
```

Charlie inspects server balance again in existing CLI session:

```bash
[wire]> payment server info
{
  "id": "vector8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
  "address": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "balance": "100.0"
}
```

Charlie and Dave list channels on their payment servers:

```bash
[wire]> payment channel list
[]
```

Charlie sets up a channel between himself and Dave:

```bash
[wire]> payment channel setup vector5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3
{
  "channelAddress": "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859"
}
```

Charlie and Dave again list channels on their payment servers:

```bash
[wire]> payment channel list
[
  "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859"
]
```

Inspect channel balances:

```bash
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{}
```

Charlie deposits funds into the channel:

```bash
[wire]> payment channel deposit 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 10
```

Charlie inspects server and channel balances:

```bash
[wire]> payment server info
{
  "id": "indra8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
  "address": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "balance": "89.999832"
}
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{}
```

Charlie reconciles channel balance with on-chain deposit:

```bash
[wire]> payment channel reconcile 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.0",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "10.0"
}
```

Dave inspects channel balances:

```bash
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.0",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "10.0"
}
```

Either side can inspect detailed channel state:

```bash
[wire]> payment channel info 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "assetIds": [
    "0x0000000000000000000000000000000000000000"
  ],
  "balances": [
    {
      "amount": [
        "0",
        "10000000000000000000"
      ],
      "to": [
        "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
        "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832"
      ]
    }
  ],
  "channelAddress": "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859",
  "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "processedDepositsA": [
    "0"
  ],
  "processedDepositsB": [
    "10000000000000000000"
  ],
  "defundNonces": [
    "1"
  ],
  "networkContext": {
    "chainId": 1337,
    "channelFactoryAddress": "0x345cA3e014Aaf5dcA488057592ee47305D9B3e10",
    "transferRegistryAddress": "0x9FBDa871d559710256a2502A2517b794B482Db40",
    "providerUrl": "http://evm_1337:8545"
  },
  "nonce": 2,
  "alice": "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
  "aliceIdentifier": "vector5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
  "bob": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "bobIdentifier": "vector8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
  "timeout": "360000",
  "latestUpdate": {
    "assetId": "0x0000000000000000000000000000000000000000",
    "balance": {
      "amount": [
        "0",
        "10000000000000000000"
      ],
      "to": [
        "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
        "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832"
      ]
    },
    "channelAddress": "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859",
    "details": {
      "totalDepositsAlice": "0",
      "totalDepositsBob": "10000000000000000000"
    },
    "fromIdentifier": "vector8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
    "nonce": 2,
    "aliceSignature": "0xedce1d0f5defd5c14d7bcd88751fd75bde525434f30b1c3f9060e65acfbdbd65788edaeef5c05ed572f9d74007c6652e07ea3169d331a3dae9b7276eeac39e6a1b",
    "bobSignature": "0xe69be44d3ade538bef8e1002f177ddf4118fb398b2a3fd38e8277b707b8f69b057461e74310a752a2d2328681d3600559512a4b8f6a7fabc948c65cc463381bf1c",
    "toIdentifier": "vector5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
    "type": "deposit"
  },
  "inDispute": false
}
```

Charlie creates a hash-locked transfer (micropayment) for Dave:

```bash
[wire]> payment transfer create 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 .1
{
  "channelAddress": "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859",
  "transferId": "0x7998d9147729f2dbc9d4356f3690ac2cbc61a93f9bc65ee92578a48eb5d332c8",
  "preImage": "0x207c471b020e4f332d5245fdd0f8fb50b0aebb6e51d6816d6449fa63a58b9055"
}
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.0",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "9.9"
}
```

Dave resolves the transfer using the pre-image provided by Charlie:

```bash
[wire]> payment transfer resolve 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 0x7998d9147729f2dbc9d4356f3690ac2cbc61a93f9bc65ee92578a48eb5d332c8 0x207c471b020e4f332d5245fdd0f8fb50b0aebb6e51d6816d6449fa63a58b9055
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.1",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "9.9"
}
```

Charlie create a coupon:

```bash
[wire]> payment coupon create 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 0.1
eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDBmODgyOTA2MmRmNjk1NjQ1NWJjMzg3OThmYjJiN2Q3NDkyMmJlOGYwMzhhMTk3OTNjNWE5N2Q4ZDQ4ODI4YTAiLCJwcmVJbWFnZSI6IjB4ZmI1MjEzNzBkYTJmNDRmODA2YjU1NjI3OTE4ODI2MWJmYWQ4NDQwNDY0MTVjNDk3ZmEzMDJmMWQyNWQ1ZjMyMSJ9
```

Dave redeems the coupon:

```bash
[wire]> payment coupon redeem eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDBmODgyOTA2MmRmNjk1NjQ1NWJjMzg3OThmYjJiN2Q3NDkyMmJlOGYwMzhhMTk3OTNjNWE5N2Q4ZDQ4ODI4YTAiLCJwcmVJbWFnZSI6IjB4ZmI1MjEzNzBkYTJmNDRmODA2YjU1NjI3OTE4ODI2MWJmYWQ4NDQwNDY0MTVjNDk3ZmEzMDJmMWQyNWQ1ZjMyMSJ9
[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.2",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "9.8"
}
```

Reedeming a used pre-image/coupon fails:

```bash
[wire]> payment coupon redeem eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDBmODgyOTA2MmRmNjk1NjQ1NWJjMzg3OThmYjJiN2Q3NDkyMmJlOGYwMzhhMTk3OTNjNWE5N2Q4ZDQ4ODI4YTAiLCJwcmVJbWFnZSI6IjB4ZmI1MjEzNzBkYTJmNDRmODA2YjU1NjI3OTE4ODI2MWJmYWQ4NDQwNDY0MTVjNDk3ZmEzMDJmMWQyNWQ1ZjMyMSJ9

Error: Request failed with status code 500
```

Charlie/Dave withdraw fund from the channel to their server (vector bug?):

```bash
[wire]> payment channel withdraw 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 0.1

[wire]> payment channel balances 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859
{
  "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63": "0.1",
  "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832": "9.8"
}
[wire]> payment server info
{
  "id": "indra5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
  "address": "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
  "balance": "0.0"
}
```

### Service Contract (Bot Factory) Demo

Charlie creates a contract file:

```bash
$ cat contract.yml
record:
  type: 'contract'
  name: 'Bot Factory Service Contract (Charlie/Dave)'
  version: '0.1.0'
  consumerAddress: '0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832'
  providerAddress: '0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63'
  expiryTime: 1617235200000
  chargeType: 'per-request'
  channelAddress: '0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859'
  assetId: '0x0000000000000000000000000000000000000000'
  amount: '0.1'
```

Charlie signs the contract and sends it over to Dave:

```bash
$ wire-dev --profile charlie wns record sign --filename contract.yml > contract-charlie-signed.yml
$ cat contract-charlie-signed.yml
record:
  type: contract
  name: Bot Factory Service Contract (Charlie/Dave)
  version: 0.1.0
  consumerAddress: '0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832'
  providerAddress: '0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63'
  expiryTime: 1617235200000
  chargeType: per-request
  channelAddress: '0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859'
  assetId: '0x0000000000000000000000000000000000000000'
  amount: '0.1'
signatures:
  - pubKey: 61rphyEC6tEq0pxTI2Sy97VlWCSZhA/PRaUfFlQjhQcpYfTfYtg=
    sig: >-
      k/Je6WvqsmyzupSZrYqZPO8WUOx8ClAR31IKfN/hY8Vp63QBJl8roGbU5MBHfbz5GOF1Dv+Wpc2IRlNghdwdrQ==
```

Dave inspects and signs the contract:

```bash
$ wire-dev --profile dave wns record sign --filename contract-charlie-signed.yml > contract-charlie-n-dave-signed.yml
$ cat contract-charlie-n-dave-signed.yml
record:
  type: contract
  name: Bot Factory Service Contract (Charlie/Dave)
  version: 0.1.0
  consumerAddress: '0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832'
  providerAddress: '0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63'
  expiryTime: 1617235200000
  chargeType: per-request
  channelAddress: '0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859'
  assetId: '0x0000000000000000000000000000000000000000'
  amount: '0.1'
signatures:
  - pubKey: 61rphyEC6tEq0pxTI2Sy97VlWCSZhA/PRaUfFlQjhQcpYfTfYtg=
    sig: >-
      k/Je6WvqsmyzupSZrYqZPO8WUOx8ClAR31IKfN/hY8Vp63QBJl8roGbU5MBHfbz5GOF1Dv+Wpc2IRlNghdwdrQ==
  - pubKey: 61rphyEDdKE3OUeb1lRTxPbVX5q31mMTJE6G21ql3XTGS9KQcvg=
    sig: >-
      4YxYKFHB2B0oGgqMy+RZ8CYI4q+Ugq5laAZag4MD/LsxX7rQPedHafPxlnLbLIUAKuplymhFoJNbc0hzDE1e+Q==
```

Either party can publish the final signed contract on-chain, noting the resulting contract ID:

```bash
$ wire-dev --profile charlie wns record publish --filename contract-charlie-n-dave-signed.yml --raw-payload
bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q
```

Inspect the on-chain contract signed by both parties:

```bash
$ wire-dev --profile charlie wns record get --id bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q
[
  {
    "id": "bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q",
    "names": null,
    "owners": [
      "0815c2be340326fdf10cd927854c2e96a2d495c3",
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "createTime": "2020-12-07T15:26:20.627934000",
    "expiryTime": "2021-12-07T15:26:20.627934000",
    "attributes": {
      "amount": "0.1",
      "channelAddress": "0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859",
      "chargeType": "per-request",
      "expiryTime": 1617235200000,
      "name": "Bot Factory Service Contract (Charlie/Dave)",
      "version": "0.1.0",
      "assetId": "0x0000000000000000000000000000000000000000",
      "consumerAddress": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
      "providerAddress": "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
      "type": "contract"
    }
  }
]
```

Dave starts a Bot Factory (running in local dev mode):

```bash
$ cd ~/projects/dxos/arena/bots/chess-bot
$ rm service.yml

$ DEBUG="client,bot-factory" WIRE_PAYMENT_ENDPOINT=http://localhost:8004 wire-dev --profile dave bot factory start --local-dev
  bot-factory Started BotFactory with node,native containers. +0ms
  bot-factory {"started":true,"topic":"58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27","peerId":"58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27","localDev":true,"controlTopic":"38f544064e2660bc8332aaac78625587262736782aa0ba5e9778715455abb81a"} +51ms
```

Charlie spawns a Chess Bot, sending an in-band micropayment (copy `topic` from Bot Factory console):

```bash
$ DEBUG=botkit-client wire-dev --profile charlie bot spawn --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --contract bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q
```

Dave's terminal:

```bash
  bot-factory Received command: {"options":{"payment":{"channelAddress":"0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859","transferId":"0xa196f829832cdcf974508fd560ca67f9fe519e8d86d2fa95c048e8956b809540","preImage":"0x4ad44cbfd9617b32ffd69961d57861f260aca2168ed81aa11e70262b0567df95","contractId":"bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q"}},"__type_url":"dxos.protocol.bot.Spawn"} +23s
  bot-factory Spawn bot request for ChessBot env: native +5ms
  client Contract: {"id":"bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q","names":null,"owners":["0815c2be340326fdf10cd927854c2e96a2d495c3","6ee3328f65c8566cd5451e49e97a767d10a8adf7"],"bondId":"8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3","createTime":"2020-12-07T15:26:20.627934000","expiryTime":"2021-12-07T15:26:20.627934000","attributes":{"consumerAddress":"0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832","name":"Bot Factory Service Contract (Charlie/Dave)","providerAddress":"0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63","version":"0.1.0","amount":"0.1","chargeType":"per-request","expiryTime":1617235200000,"type":"contract","assetId":"0x0000000000000000000000000000000000000000","channelAddress":"0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859"}} +0ms
  client Validating received payment: {"assetId":"0x0000000000000000000000000000000000000000","balances":{"0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832":"0.1","0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63":"0.0"},"channelAddress":"0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859","transferId":"0xa196f829832cdcf974508fd560ca67f9fe519e8d86d2fa95c048e8956b809540"} +103ms
  bot-factory Spawned bot: {"pid":59163,"command":"yarn","args":["--silent","babel-watch","--use-polling","src/main.js"],"wireEnv":{"WIRE_BOT_CONTROL_TOPIC":"83d673d97bcad7f54ff64a44041f935776fde32eea20635bb20790ee5ad94c5d","WIRE_BOT_UID":"0df9c4e649bcaa37d9adccf15365f083933b7dc9e51ed64ee36d21eb3d615845","WIRE_BOT_NAME":"bot:ChessBot Harbor Porpoise","WIRE_BOT_CWD":"/Users/ashwinp/projects/dxos/arena/bots/chess-bot/.bots/0df9c4e649bcaa37d9adccf15365f083933b7dc9e51ed64ee36d21eb3d615845","WIRE_BOT_RESTARTED":"false"},"cwd":"/Users/ashwinp/projects/dxos/arena/bots/chess-bot/.bots/0df9c4e649bcaa37d9adccf15365f083933b7dc9e51ed64ee36d21eb3d615845"} +445ms
  bot-factory:59163 regitered wrn://protocol.dxos.org/arena/chess
  bot-factory:59163  +0ms
```

Charlie's terminal:

```bash
  botkit-client Bot factory peer connected +0ms
  botkit-client Sending spawn request for bot undefined +0ms
key    value
-----  ----------------------------------------------------------------
botId  0df9c4e649bcaa37d9adccf15365f083933b7dc9e51ed64ee36d21eb3d615845
```

Charlie spawns a Chess Bot, using a coupon created in the CLI for payment:

```bash
[wire]> payment coupon create 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 0.1 --contract bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q
eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDlkMzRiY2NhNzBkYTIwMjdmZjljMGM3YjVlMjAyODFiNjJlZGVmNmEzMmQ5NTQ2N2Y2MWZjMzVjZmEwN2I4NzUiLCJwcmVJbWFnZSI6IjB4ZjUyY2Y3NjBkNGUxNDAxZTFhODliMmVlMWNlNjUwZjYyNGUxYzVmNTFiZmFkYmZkMzE1NzExMzk5YWIyMGQ0NCIsImNvbnRyYWN0SWQiOiJiYWZ5cmVpZnNtY2V5cXdmNGxuemM1aGN5cXFveno2bGhmenNqYmkyemh2bXVkZnQ1YWJhcWNkb2YzcSJ9
```

```bash
$ DEBUG=botkit-client wire-dev --profile charlie bot spawn --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --coupon eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDlkMzRiY2NhNzBkYTIwMjdmZjljMGM3YjVlMjAyODFiNjJlZGVmNmEzMmQ5NTQ2N2Y2MWZjMzVjZmEwN2I4NzUiLCJwcmVJbWFnZSI6IjB4ZjUyY2Y3NjBkNGUxNDAxZTFhODliMmVlMWNlNjUwZjYyNGUxYzVmNTFiZmFkYmZkMzE1NzExMzk5YWIyMGQ0NCIsImNvbnRyYWN0SWQiOiJiYWZ5cmVpZnNtY2V5cXdmNGxuemM1aGN5cXFveno2bGhmenNqYmkyemh2bXVkZnQ1YWJhcWNkb2YzcSJ9

  botkit-client Bot factory peer connected +0ms
  botkit-client Sending spawn request for bot undefined +1ms
key    value
-----  ----------------------------------------------------------------
botId  6cad478818fffb7cec95d3671682257620726d73288ec4821dd8334a35ddfa48
```

Spending an used coupon doesn't work (left as an exercise to the reader).

Charlie create a Party and invites a spawned Bot, sending a micropayment in-band:

```bash
$ DEBUG=botkit-client wire-dev --profile charlie party create
{
  "partyKey": "dd2382327900a5de068fb8ac88370f3293e7bf3f5c7e1205649fd1e0eb360d95"
}

[wire]> bot invite --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --contract bafyreifsmceyqwf4lnzc5hcyqqozz6lhfzsjbi2zhvmudft5abaqcdof3q --bot-id 918e615bc21a22b13c5fa6e0f84fcd62bdb64b2035c5b440799788a36859ab2e
```

Charlie plays Chess with the bot:

```bash
[wire]> chess create

Party members:
0) cli:ashwinp
1) bot:ChessBot Indian Rhinoceros



Select white player (0 - 1): 0
Select black player (0 - 1): 1
Game undefined created.
cli:ashwinp selected to play white.
bot:ChessBot Indian Rhinoceros selected to play black.

Game ID: 1aba1d91269a680b00dda5363ee21a9f7fa34f4fe9aace9eaaff2e61c515f3eb
[wire]> chess move d2 d4
[wire]>
   +------------------------+
 8 | r  n  b  q  k  b  n  r |
 7 | p  p  p  p  p  p  p  p |
 6 | .  .  .  .  .  .  .  . |
 5 | .  .  .  .  .  .  .  . |
 4 | .  .  .  P  .  .  .  . |
 3 | .  .  .  .  .  .  .  . |
 2 | P  P  P  .  P  P  P  P |
 1 | R  N  B  Q  K  B  N  R |
   +------------------------+
     a  b  c  d  e  f  g  h

Next move: bot:ChessBot Indian Rhinoceros
[wire]>
   +------------------------+
 8 | r  n  b  q  k  b  n  r |
 7 | p  p  p  p  p  .  p  p |
 6 | .  .  .  .  .  p  .  . |
 5 | .  .  .  .  .  .  .  . |
 4 | .  .  .  P  .  .  .  . |
 3 | .  .  .  .  .  .  .  . |
 2 | P  P  P  .  P  P  P  P |
 1 | R  N  B  Q  K  B  N  R |
   +------------------------+
     a  b  c  d  e  f  g  h

Next move: cli:ashwinp
```

## Troubleshooting

* CLI error on party create (https://github.com/dxos/cli/issues/83)
* Check signal server config in CLI profile if CLI can't connect to Bot Factory.
