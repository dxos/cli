# MDNS CLI

## Setup

### Install / Upgrade

To install or upgrade a version of the mdns run:

```bash
$ wire mdns install
```

This will install globally the latest version of mdns. The default npmClient (`npm`) is configured in your config.yml as `cli.npmClient`.

> You can also use `--npmClient` param to specify the desired client ('npm|yarn');


### Start / Stop

To start the service:

```bash
$ wire mdns start --daemon --hostnames <MDNS_NAMES> --interfaces <INTERFACES>
```

Then to stop:

```bash
$ wire mdns stop
```
