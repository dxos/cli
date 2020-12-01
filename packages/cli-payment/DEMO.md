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
$ git checkout vector-0.0.12
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
  "id": "indra8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
  "address": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "balance": "0.0"
}
[wire]>
```

Dave inspects payment server info, starts interactive terminal:

```bash
$ wire-dev --profile dave payment server info
{
  "id": "indra5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
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
  "id": "indra8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
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
[wire]> payment channel setup indra5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3
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
  "networkContext": {
    "chainId": 1337,
    "channelFactoryAddress": "0x345cA3e014Aaf5dcA488057592ee47305D9B3e10",
    "transferRegistryAddress": "0x9FBDa871d559710256a2502A2517b794B482Db40",
    "providerUrl": "http://evm_1337:8545"
  },
  "nonce": 2,
  "alice": "0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63",
  "aliceIdentifier": "indra5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
  "bob": "0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832",
  "bobIdentifier": "indra8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
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
    "fromIdentifier": "indra8WxfqTu8EC2FLM6g4y6TgbSrx4EPP9jeDFQk3VBsBM7Jv8NakR",
    "nonce": 2,
    "aliceSignature": "0xfa0b4f705143b54cb88e1488f3caf461ca82ec170ef1bbd70a4dee631a75f2a31c328b0d6303e70562e0ce83e1b3af1dd7c3ad4ecc86475705dbe6652f190fed1c",
    "bobSignature": "0x5fe63cdacc287ff5166452d3800d22b4a9032bf7c587be3c1ca71d4f41742a3d57b17bf4a89df539ecdbc2681acebb2eb1533451decd6de8ff9267d965664d201b",
    "toIdentifier": "indra5ArRsL26avPNyfvJd2qMAppsEVeJv11n31ex542T9gCd5B1cP3",
    "type": "deposit"
  },
  "defundNonce": "1",
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

### Bot Demo

Dave starts a Bot Factory (running in local dev mode):

```bash
$ cd ~/projects/dxos/arena/bots/chess-bot
$ rm service.yml

$ WIRE_PAYMENT_ENDPOINT=http://localhost:8004 wire-dev --profile dave bot factory start --local-dev
  bot-factory Started BotFactory with node,native containers. +0ms
  bot-factory {"started":true,"topic":"58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27","peerId":"58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27","localDev":true,"controlTopic":"38f544064e2660bc8332aaac78625587262736782aa0ba5e9778715455abb81a"} +51ms
```

Charlie spawns a Chess Bot, sending an in-band micropayment (copy `topic` from Bot Factory console):

```bash
$ DEBUG=botkit-client wire-dev --profile charlie bot spawn --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --channel 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 --amount 0.1
```

Dave's terminal:

```bash
  bot-factory Received command: {"options":{"payment":{"channelAddress":"0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859","transferId":"0x0ee7e2a64e4f538dbeef20d33d8cf06e090e612147640825ebcad5819bbec473","preImage":"0x1fb8d572090bd1af9ae9823e9d43c9880aeb95b6ac3ebe64f4f474f2702b1e2e"}},"__type_url":"dxos.protocol.bot.Spawn"} +7m
  bot-factory Spawn bot request for ChessBot env: native +4ms
  bot-factory Validating received payment: {"assetId":"0x0000000000000000000000000000000000000000","balances":{"0x119a11d0D1686C7330cA0650E26Fd6889Fbeb832":"0.1","0x95B7e93A3aF19AcAE95aD120d4D8307bF1a6Be63":"0.0"},"channelAddress":"0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859","transferId":"0x0ee7e2a64e4f538dbeef20d33d8cf06e090e612147640825ebcad5819bbec473"} +105ms
  bot-factory Spawned bot: {"pid":76934,"command":"yarn","args":["--silent","babel-watch","--use-polling","src/main.js"],"wireEnv":{"WIRE_BOT_CONTROL_TOPIC":"38f544064e2660bc8332aaac78625587262736782aa0ba5e9778715455abb81a","WIRE_BOT_UID":"70e1d0e212d9f62b11fb8b919f7b016e0b377fd60b3e04f90add0794567cd5ad","WIRE_BOT_NAME":"bot:ChessBot Lion","WIRE_BOT_CWD":"/Users/ashwinp/projects/dxos/arena/bots/chess-bot/.bots/70e1d0e212d9f62b11fb8b919f7b016e0b377fd60b3e04f90add0794567cd5ad","WIRE_BOT_RESTARTED":"false"},"cwd":"/Users/ashwinp/projects/dxos/arena/bots/chess-bot/.bots/70e1d0e212d9f62b11fb8b919f7b016e0b377fd60b3e04f90add0794567cd5ad"} +198ms
  bot-factory:76934 regitered wrn://protocol.dxos.org/arena/chess
  bot-factory:76934  +0ms
```

Charlie's terminal:

```bash
  botkit-client Bot factory peer connected +0ms
  botkit-client Sending spawn request for bot undefined +0ms
key    value
-----  ----------------------------------------------------------------
botId  70e1d0e212d9f62b11fb8b919f7b016e0b377fd60b3e04f90add0794567cd5ad
```

Charlie spawns a Chess Bot, using a coupon create in the CLI for payment:

```bash
$ DEBUG=botkit-client wire-dev --profile charlie bot spawn --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --coupon eyJjaGFubmVsQWRkcmVzcyI6IjB4NDc4MDlDRDMyMThjNjlhQjIxQmVFZThhZDZhN2I3RWM1RTAyNjg1OSIsInRyYW5zZmVySWQiOiIweDA2NmRiODk0MjM2MTYyYWIwNjJlY2UwNjg0MjAyZDBjYTMyMDQ3YmJkZjY0MDUyYjVmNTdiZWY3ZjU5OTAzOWMiLCJwcmVJbWFnZSI6IjB4YmM2OWQxOTBiYzA2NDM5MjJmODhhNzZkYzU5MmE4ZmE3ZjRmZTQ2YjIxM2MwYjRkYmYxYzQ1MDI4OTJjYjE3NCJ9

  botkit-client Bot factory peer connected +0ms
  botkit-client Sending spawn request for bot undefined +1ms
key    value
-----  ----------------------------------------------------------------
botId  918e615bc21a22b13c5fa6e0f84fcd62bdb64b2035c5b440799788a36859ab2e
```

Spending an used coupon doesn't work (left as an exercise to the reader).

Charlie create a Party and invites a spawned Bot, sending a micropayment in-band:

```bash
$ DEBUG=botkit-client wire-dev --profile charlie party create
{
  "partyKey": "dd2382327900a5de068fb8ac88370f3293e7bf3f5c7e1205649fd1e0eb360d95"
}

[wire]> bot invite --topic 58246306fc6db3c9235b9ee59f3426539988f465e1bb6919dce1edb169081c27 --channel 0x47809CD3218c69aB21BeEe8ad6a7b7Ec5E026859 --amount 0.1 --bot-id 918e615bc21a22b13c5fa6e0f84fcd62bdb64b2035c5b440799788a36859ab2e
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
