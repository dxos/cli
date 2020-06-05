# Bot CLI

Read [concepts](../botkit/README.md) first, if unfamiliar with how bots work.

Commands:

* `wire bot publish` - Publish bot packages to IPFS.
* `wire bot register` - Register a bot in WNS.
* `wire bot query` - Query bot in WNS.
* `wire bot factory start` - Start a bot factory.

## Local Development

To aid local development, bot factories can be made to run bot code directly from a bot directory, bypassing WNS/IPFS.

For example:

```bash
$ cd examples/echo-bot
$ yarn wire bot factory start --local-dev
  bot-factory {"started":true,"topic":"83e8b9ac8d7a22d096673f2f55b13346f225fd060fe869fab9c26042716753b5","peerId":"83e8b9ac8d7a22d096673f2f55b13346f225fd060fe869fab9c26042716753b5","localDev":true}
```

Use the swarm `topic` from the output to connect to the bot factory, e.g. to spawn a bot.

## Publishing/Registering Bots

Bot binary packages are published to IPFS. Bot metadata is registered in WNS.

Note:
* Ensure the `wire` CLI is configured correctly.
* Cross compilation doesn't work correctly, so binaries are built on the corresponding platform.


Create self-contained bot packages for supported platforms.

```bash
$ cd packages/echo-bot
$ yarn package:macos-x64
```

Upload the packages to IPFS.

```bash
$ yarn wire bot publish
Uploaded macos-x64.tgz to IPFS, CID: QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn
Package contents have changed.
Run 'wire bot register' to register the new bot version: 1.0.53
```

Inspect bot.yml before registering.

```bash
$ cat bot.yml
id: 'wrn:bot:wireline.io/echo'
name: ECHO
version: 1.0.53
package:
  linux:
    x64: QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA
    arm: QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg
  macos:
    x64: QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn
```

Register the bot with WNS.

```bash
$ yarn wire bot register
```

Query registered bot.

```bash
$ yarn wire bot query --name 'wireline.io/echo'
[
  {
    "id": "QmbwMajMxYsFrgZpLt7feSr88VvpAEJrrXwRBF1FwL6EoR",
    "type": "wrn:bot",
    "name": "wireline.io/echo",
    "version": "1.0.53",
    "owners": [
      "6ee3328f65c8566cd5451e49e97a767d10a8adf7"
    ],
    "bondId": "8e340dd7cf6fc91c27eeefce9cca1406c262e93fd6f3a4f3b1e99b01161fcef3",
    "createTime": "2020-04-30T10:37:00.974990000",
    "expiryTime": "2021-04-30T10:37:00.974990000",
    "attributes": {
      "displayName": "ECHO",
      "name": "wireline.io/echo",
      "package": {
        "linux": {
          "arm": "QmX3DDmeFunX5aVmaTNnViwQUe15Wa4UbZYcC3AwFwoWcg",
          "x64": "QmVRmLrQeLZS8Xee7YVzYYAQANWmXqsNgNkaPMxM8MtPLA"
        },
        "macos": {
          "x64": "QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn"
        }
      },
      "type": "wrn:bot",
      "version": "1.0.53"
    }
  }
]
```

## Running Bots (via WNS/IPFS)

Start the bot factory. The `topic` logged by bot-factory is the swarm topic that the CLI uses to connect to the bot factory. Provide it to the spawn command later.

```bash
$ cd dxos/botkit

$ yarn run wire bot factory start
  bot-factory {"started":true,"topic":"0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e","peerId":"0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e","localDev":false}
```

Create a new party.

```bash
$ cd dxos/data-cli

$ yarn run wire party create
{
  "partyKey": "bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483"
}
[wire]>
```

Spawn the echo bot. Use topic from the bot factory console output, enabling the CLI to connect to it. Use echo-bot version from `echo-bot/bot.yml`.

```bash
[wire]> bot spawn --bot-id="wrn:bot:wireline.io/echo#1.0.53" --spec='{"type":"testing.item.Task","listId":"list-tasks"}' --topic 0955697f31e973503286ded7b426fa6725b9e6c9e06ba112f537467b0a1beb1e
Spawning bot wrn:bot:wireline.io/echo#1.0.53 to join 'bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483' party with invitation: {"swarmKey":"305b70cf46d0e22628d424fce23ea6f76bd9da44df8a3ed3fe70e56858b0bffa","invitation":"878c110aaab9a7173e3562e882e10c4480c32789ff012733825034c1fa340be7","hash":"b8f9fc83963153f63ae9e36871abed598f248d61"}.
[wire]>
```

Bot factory should download and spawn the bot:

```bash
  bot-factory Spawn bot request for wrn:bot:wireline.io/echo#1.0.53: {"botConfig":{"botId":"wrn:bot:wireline.io/echo#1.0.53","topic":"bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483","modelOptions":"{\"type\":\"testing.item.Task\",\"listId\":\"list-tasks\"}","invitation":"{\"swarmKey\":\"305b70cf46d0e22628d424fce23ea6f76bd9da44df8a3ed3fe70e56858b0bffa\",\"invitation\":\"878c110aaab9a7173e3562e882e10c4480c32789ff012733825034c1fa340be7\",\"hash\":\"b8f9fc83963153f63ae9e36871abed598f248d61\"}","__type_url":"dxos.protocol.bot.Spawn"}} +0ms
  bot-factory Downloading bot package: http://127.0.0.1:8888/ipfs//QmXf72DJYLNokVG7HMZnxeXoc3gLdQ8q5H5gK8D9zmR4Mn +7ms
  bot-factory Bot package downloaded: /Users/ashwinp/projects/wireline/incubator/dxos/botkit/out/bots/QmbwMajMxYsFrgZpLt7feSr88VvpAEJrrXwRBF1FwL6EoR +955ms
  bot-factory Spawned bot: {"pid":61969,"command":"/Users/ashwinp/projects/wireline/incubator/dxos/botkit/out/bots/QmbwMajMxYsFrgZpLt7feSr88VvpAEJrrXwRBF1FwL6EoR/main.bin","args":[],"wireEnv":{"WIRE_BOT_IPC_SERVER":"bot-61894","WIRE_BOT_TOPIC":"bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483","WIRE_BOT_SPEC":"{\"type\":\"testing.item.Task\",\"listId\":\"list-tasks\"}","WIRE_BOT_INVITATION":"{\"swarmKey\":\"305b70cf46d0e22628d424fce23ea6f76bd9da44df8a3ed3fe70e56858b0bffa\",\"invitation\":\"878c110aaab9a7173e3562e882e10c4480c32789ff012733825034c1fa340be7\",\"hash\":\"b8f9fc83963153f63ae9e36871abed598f248d61\"}"},"topic":"bd0f63cb1dad10889902d8b8ba450db128f9cf019b34d6b91e0362a108085483","spec":"{\"type\":\"testing.item.Task\",\"listId\":\"list-tasks\"}","cwd":"/Users/ashwinp/projects/wireline/incubator/dxos/botkit/out/bots/QmbwMajMxYsFrgZpLt7feSr88VvpAEJrrXwRBF1FwL6EoR/.bots/d50e8a9f-f02c-4863-83b6-968749924ef3"} +19ms
```

Note: The bot package is downloaded to the `botkit/out/bots/<CID>` folder. Delete the `botkit/out/bots` directory to re-test the bot install flow later.

Add a new task from the CLI session. The spawned echo-bot will log the mutations.

```bash
[wire]> echo open --type="testing.item.Task" --args.listId="list-tasks"
[wire]> echo append --data.title="Hello World"
{"title":"Hello"}
[wire]> [{"id":"testing.item.Task/cd3aa78a-c64c-4480-82b8-e54115a2f5c8","properties":{"title":"Hello"}}]
[wire]>
[wire]> echo append --data.title="Hello World"
{"title":"Hello"}
[wire]> [{"id":"testing.item.Task/cd3aa78a-c64c-4480-82b8-e54115a2f5c8","properties":{"title":"Hello"}},{"id":"testing.item.Task/3a7703af-900b-424a-831a-712f8a0243ad","properties":{"title":"Hello"}}]
[wire]>
```

Spawned echo-bot:

```bash
  bot-factory:61969 [{"id":"testing.item.Task/cd3aa78a-c64c-4480-82b8-e54115a2f5c8","properties":{"title":"Hello"}}]
  bot-factory:61969  +0ms
  bot-factory:61969 [{"id":"testing.item.Task/cd3aa78a-c64c-4480-82b8-e54115a2f5c8","properties":{"title":"Hello"}},{"id":"testing.item.Task/3a7703af-900b-424a-831a-712f8a0243ad","properties":{"title":"Hello"}}]
  bot-factory:61969  +3s
```
