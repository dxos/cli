[![build](https://github.com/dxos/cli/actions/workflows/all-lint-built-test.yml/badge.svg)](https://github.com/dxos/cli/actions/workflows/all-lint-built-test.yml)

# DXOS CLI

The DXOS CLI is an extensible set of command line tools.

If you are unfamiliar with DXOS, see our [website](https://dxos.org) for more information.

## Prerequisites

- [jq](https://stedolan.github.io/jq/)

## Installation

Install CLI globally:

```bash
$ yarn global add @dxos/cli@beta
```

or

```
$ npm install --global @dxos/cli@beta
```

### Upgrade

An older version of the CLI could be upgraded via `dx upgrade` command.

```
$ dx version
v1.0.1-beta.15

$ dx upgrade --force
Found extensions: @dxos/cli-data, @dxos/cli-signal, @dxos/cli-bot, @dxos/cli-app
✔ Uninstalling @dxos/cli-data
✔ Uninstalling @dxos/cli-signal
✔ Uninstalling @dxos/cli-bot
✔ Uninstalling @dxos/cli-app
✔ Uninstalling @dxos/cli
✔ Installing @dxos/cli
✔ Installing @dxos/cli-app
✔ Installing @dxos/cli-bot
✔ Installing @dxos/cli-signal
✔ Installing @dxos/cli-data

$ dx version
v1.0.1-beta.16
```

## Usage

All the CLI modules support `help` flag that provides desired command clarification, e.g.

```bash
$ dx help
```

```bash
$ dx app help
```

```bash
$ dx app register help
```

To use the CLI, a profile needs to be created and activated.

```bash
$ dx profile init --name enterprise --template-url https://git.io/JKpLV
```

Read more about [CLI profiles](./packages/cli/README.md#profiles) and [CLI extensions](./packages/cli/README.md#extensions).

## Development

Check the [DXOS CLI Development](./packages/cli/README.md#Development).

## Troubleshooting

Check the [DXOS CLI Troubleshooting](./packages/cli/README.md#Troubleshooting).
