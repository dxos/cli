# Peer CLI

CLI extension for interactions between peers.

## Messenger

`wire peer messenger` command is used to run a p2p chat messenger.
Optional `--topic` parameter defines swarm topic for messenger. (Default value is `0000000000000000000000000000000000000000000000000000000000000000`).
Optional `--generate-topic` flag allows to autogenerate a new topic, different from default.

```
$ wire peer messenger

PeerId: 207906669fe9a2891e8ff86e99d271bb13bc4f2cc0b46e82334ac798a5454025
Topic: 0000000000000000000000000000000000000000000000000000000000000000

[indigo-massachusetts-glucose-oklahoma] >
```
