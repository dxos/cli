# MDNS CLI

## Setup

### Install / Upgrade

To install or upgrade a version of the mdns run:

```bash
$ dx mdns install
```

This will install globally the latest version of mdns. The default npmClient (`npm`) is configured in your profile config as `cli.npmClient`.

> You can also use `--npmClient` param to specify the desired client ('npm|yarn');


### Start / Stop

To start the service:

```bash
$ dx mdns start --daemon --hostnames <MDNS_NAMES> --interfaces <INTERFACES>
```

Then to stop:

```bash
$ dx mdns stop
```
