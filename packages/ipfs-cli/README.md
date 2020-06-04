# IPFS CLI

CLI extension for IPFS operations.

## Operations

### Start / stop IPFS daemon

`wire ipfs start` command is used to start IPFS.

Optional `--daemon` flag allows to start IPFS as a daemon, with enabled autorestart on fail and restart in case when memory limit exceeded.

In case of starting as a daemon, one need to make sure process has write access to log file, located by default at `/var/log/ipfs.log`. Alternative location of the log file could be defined via optional `--log-file` parameter.

By default, started IPFS node swarms with other DxOS IPFS nodes, bootstrapped from WNS. Interval of swarm connections could be defined with `--connect-interval` (in seconds), default is `300`. WNS bootstrap could be turned on/off using `--wns-bootstrap` flag, which is `true` by default.

```
$ wire ipfs start --daemon --log-file "/tmp/ipfs.log"
```

In case when IPFS was started as a daemon, `wire ipfs stop` command could be used for its stopping.

// TODO(egorgripasov): Not only for daemon case?

### IPFS find.

`wire ipfs find` command is used to find file in IPFS nodes, both registered and not registred with WNS. Command requires IPFS node running locally.

Command supports lookup of app, bot or just hash, e.g.:

Hash lookup:

```
$ wire ipfs find QmWztwfX8JRepUZdbFF7ygJy1Bhfks33W7SocZnqzx2T4k
```

App lookup:

```
$ wire ipfs find app example.com/editor
```

Bot lookup: (resuires additional `--platform` parameter)

```
$ wire ipfs find bot wireline.io/store --platform macos-x64
```