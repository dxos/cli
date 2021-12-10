# Dashboard CLI

## Install / Upgrade

To install or upgrade a version of the dashboard run:

```bash
dx dashboard install
```

This will install globally the latest version of the dashboard. The default npmClient (`npm`) is configured in your config.yml as `cli.npmClient`.

> You can also use `--npmClient` param to specify the desired client ('npm|yarn');


## Start / Stop

To start the service:

```bash
dx dashboard start --port 8888
```
> You can use `--detached` to run in background.

Then to stop:

```bash
dx dashboard stop
```
