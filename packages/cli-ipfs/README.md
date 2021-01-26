# IPFS CLI

CLI extension for IPFS operations.

## Operations

### Start / stop IPFS daemon

`dx ipfs start` command is used to start IPFS.

Optional `--daemon` flag allows to start IPFS as a daemon, with enabled autorestart on fail and restart in case when memory limit exceeded.

In case of starting as a daemon, one need to make sure process has write access to log file, located by default at `/var/log/ipfs.log`. Alternative location of the log file could be defined via optional `--log-file` parameter.

By default, started IPFS node swarms with other DXOS IPFS nodes, bootstrapped from Registry. Interval of swarm connections could be defined with `--connect-interval` (in seconds), default is `300`. Registry bootstrap could be turned on/off using `--registry-bootstrap` flag, which is `true` by default.

```
$ dx ipfs start --daemon --log-file "/tmp/ipfs.log"
```

In case when IPFS was started as a daemon, `dx ipfs stop` command could be used for its stopping.

// TODO(egorgripasov): Not only for daemon case?

### IPFS find.

`dx ipfs find` command is used to find file in IPFS nodes, both registered and not registred with Registry. Command requires IPFS node running locally.

Command supports lookup of app, bot or just hash, e.g.:

Hash lookup:

```
$ dx ipfs find QmWztwfX8JRepUZdbFF7ygJy1Bhfks33W7SocZnqzx2T4k
```

App lookup:

```
$ dx ipfs find app example.com/editor
```

Bot lookup: (resuires additional `--platform` parameter)

```
$ dx ipfs find bot dxos.org/echo --platform macos-x64
```
