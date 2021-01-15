# Bot CLI

Read [concepts](https://github.com/dxos/sdk/tree/main/bot/botkit) first, if unfamiliar with how bots work.

Commands:

* `dx bot publish` - Publish bot packages to IPFS.
* `dx bot register` - Register a bot in WNS.
* `dx bot query` - Query bot in WNS.
* `dx bot factory start` - Start a bot factory.
* `dx bot spawn` - Spawn new bot instance.
* `dx bot factory status` - Obtain bot factory status.

Bot management commands: 

* `dx bot stop` - Stop bot.
* `dx bot start` - Start bot.
* `dx bot restart` - Restart bot.
* `dx bot kill` - Stop bot and remove all its data.
* `dx bot factory reset` - Stop all runinng bots and remove all the data.

## Local Development

To aid local development, bot factories can be made to run bot code directly from a bot directory, bypassing WNS/IPFS.

For example:

```bash
$ cd examples/echo-bot
$ dx bot factory start --local-dev --reset
  bot-factory {"started":true,"topic":"83e8b9ac8d7a22d096673f2f55b13346f225fd060fe869fab9c26042716753b5","peerId":"83e8b9ac8d7a22d096673f2f55b13346f225fd060fe869fab9c26042716753b5","localDev":true}
```

Use the swarm `topic` from the output to connect to the bot factory, e.g. to spawn a bot.

## Publishing/Registering Bots

Bot binary packages are published to IPFS. Bot metadata is registered in WNS.

Note:
* Ensure the `dx` CLI is configured correctly.
* Cross compilation doesn't work correctly, so binaries are built on the corresponding platform.

Create self-contained bot packages for supported platforms.

```bash
$ cd packages/echo-bot
$ yarn package:macos-x64
```

Upload the packages to IPFS.

```bash
$ dx bot publish
Uploaded macos-x64.tgz to IPFS, CID: QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn
Package contents have changed.
Run 'dx bot register' to register the new bot version: 1.0.53
```

Inspect bot.yml before registering.

```bash
$ cat bot.yml
name: ExampleBot
version: 0.0.1
package:
  linux:
    x64:
      /: QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA
    arm:
      /: QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg
  macos:
    x64:
      /: QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn
```

Register the bot with WNS.

> You could use optional `--name` argument in order to assign specific name to the record.

```bash
$ dx bot register --name "wrn://dxos/bot/example"
```

Query registered bot.

```bash
$ dx bot query
[
  {
    "id": "bafyreialjdlezoavldq6wun6i4p3oq6iln4pniqmodweo4ut3q4n3kgxni",
    "names": [
      "wrn://dxos/bot/example"
    ],
    "owners": [
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "d466a4a9a640040f3d9582a5dc8797b43409c3bfde338b4b74ead9ffa225b494",
    "createTime": "2020-08-25T18:47:58.737921941",
    "expiryTime": "2021-08-25T18:47:58.737921941",
    "attributes": {
      "name": "ExampleBot",
      "package": {
        "linux": {
          "x64": {
            "/": "QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA"
          },
          "arm": {
            "/": "QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg"
          }
        },
        "macos": {
          "x64": {
            "/": "QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn"
          }
        }
      },
      "type": "wrn:bot",
      "version": "0.0.1"
    }
  }
]
```

## Running Bots (via WNS/IPFS)

Start the bot factory. The `topic` logged by bot-factory is the swarm topic that the CLI uses to connect to the bot factory. Provide it to the spawn command later.

```bash
$ cd dxos/botkit

$ dx bot factory start
  bot-factory {"started":true,"topic":"0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e","peerId":"0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e","localDev":false}
```
> Bot factory will attempt to restart previously running bots unless you provide `--reset` flag.

From another terminal spawn new bot instance using bot factory topic .

```bash
$ dx bot spawn --bot-name="wrn://dxos/bot/example" --topic 0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e

key     value
------  ----------------------------------------------------------------
botId  55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef
```

Create a new party.

```bash
$ dx party create
{
  "partyKey": "bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483"
}
[dx]>
```

Using bot factory topic and bot Id invite previously spawned bot to the party.

```bash
[dx]> bot invite --topic 0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e --bot-id 55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef

Inviting bot 55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef to join 'bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483' party with invitation: {"swarmKey":"c05c32751bb1a70fe70d801e4101c706c729f1bdf622f14cd3e9721effe1a2e8","invitation":"784cf2ab3ce3bb1be56dec738b9ab1d8a020cc95a54b619acdd084471f3ae154","hash":"3d36a6188a28a22f4b8f794ee9433cce6ca1b9b3"}
```

Bot factory should download and spawn the bot:

```bash
  bot-factory Received command: {"botId":"wrn:bot:dxos.org/echo","__type_url":"dxos.protocol.bot.Spawn"} +3m
  bot-factory Spawn bot request forwrn:bot:dxos.org/echo +1ms
  bot-factory Downloading bot package: http://127.0.0.1:8888/ipfs/QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn +678ms
  bot-factory Bot package downloaded: /Users/egorgripasov/Projects/dxos/tests/botfactory/out/bots/QmV4MRDvTyrBfVVk7aXUxYtRWYWkv86pSYVME49XMHJ6xj +1s
  bot-factory Spawned bot: {"pid":39899,"command":"/Users/egorgripasov/Projects/dxos/tests/botfactory/out/bots/QmV4MRDvTyrBfVVk7aXUxYtRWYWkv86pSYVME49XMHJ6xj/main.bin","args":[],"dxEnv":{"WIRE_BOT_IPC_SERVER":"bot-39752","WIRE_BOT_UID":"55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef","WIRE_BOT_NAME":"bot:Store Pygmy Marmoset","WIRE_BOT_CWD":"/Users/egorgripasov/Projects/dxos/tests/botfactory/out/bots/QmV4MRDvTyrBfVVk7aXUxYtRWYWkv86pSYVME49XMHJ6xj/.bots/55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef","WIRE_BOT_RESTARTED":false},"cwd":"/Users/egorgripasov/Projects/dxos/tests/botfactory/out/bots/QmV4MRDvTyrBfVVk7aXUxYtRWYWkv86pSYVME49XMHJ6xj/.bots/55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef"} +20ms
  bot-factory Received command: {"botUID":"55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef","topic":"bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483","modelOptions":"{}","invitation":"{\"swarmKey\":\"35769cec26533f9f4b4bb889320e473343902a9a8a210089b986e2cbd4ce47b9\",\"invitation\":\"bd996bd739be0187266830186d61fcbed21eece6c26c92be20c146b35ba28cf1\",\"hash\":\"a19549792f280a43d5fc9ad628393167a83fa744\"}","__type_url":"dxos.protocol.bot.Invite"} +3s
  bot-factory Invite bot request for '55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef': {"botUID":"55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef","topic":"bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483","modelOptions":"{}","invitation":"{\"swarmKey\":\"35769cec26533f9f4b4bb889320e473343902a9a8a210089b986e2cbd4ce47b9\",\"invitation\":\"bd996bd739be0187266830186d61fcbed21eece6c26c92be20c146b35ba28cf1\",\"hash\":\"a19549792f280a43d5fc9ad628393167a83fa744\"}","__type_url":"dxos.protocol.bot.Invite"} +0ms
```

Note: The bot package is downloaded to the `botkit/out/bots/<CID>` folder. Delete the `botkit/out/bots` directory to re-test the bot install flow later.

Check out bot factory status.

```bash
$ dx bot factory status --topic 0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e | jq
{
  "started": true,
  "version": "1.0.0-beta.87",
  "uptime": "136",
  "bots": [
    {
      "type": "wrn:bot:dxos.org/echo",
      "botUID": "55c99bc68a6a35dd5216bebfde043ae07616d8a92a85a6fd3e91650ccccbfcef",
      "started": "2020-06-24T20:05:15Z",
      "lastActive": "2020-06-24T20:06:54Z",
      "stopped": false,
      "parties": [
        "bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483"
      ]
    }
  ]
}
```

## Troubleshooting

Get status of running BotFactory:

```bash
$ dx bot factory status --topic=$(dx wns name resolve wrn://dxos/service/bot-factory/apollo1 | jq -r '.records[0].attributes.topic') | jq
{
  "started": true,
  "version": "1.0.0-moon.4",
  "uptime": "1119239",
  "platform": "linux.x64",
  "bots": [
    {
      "type": "wrn://dxos/bot/chess",
      "botUID": "ea76f653aa32c20c5e87efd6cc83db70f735aac9ae8435b9009c988346aeea6e",
      "started": "2020-08-27T19:46:15Z",
      "lastActive": "2020-08-27T19:46:39Z",
      "stopped": true,
      "parties": [
        "886d19901b0230e3c648a96c7fb5cddd8e46f1803f00c9c2d24d7903688e0d36"
      ]
    },
    {
      "type": "wrn://dxos/bot/store",
      "botUID": "9c31db6af9f486f5167b862490b80be0b4da097056c0dc3810ca9b50ec60983d",
      "started": "2020-09-03T14:17:54Z",
      "lastActive": "2020-09-03T16:00:05Z",
      "stopped": false,
      "parties": [
        "3b51679030b42f7eaad380933d5ae0d5bd4f2a9924b9c5bde71e9af00a738c99"
      ]
    }
  ]
}
```

Hard reset BotFactory (kills all bots, removes all the data/keys, restarts BotFactory):

```bash
$ dx bot factory reset --hard --topic=$(dx wns name resolve wrn://dxos/service/bot-factory/apollo2 | jq -r '.records[0].attributes.topic')
```
