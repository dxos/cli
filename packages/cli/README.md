# DXOS CLI

## Testing

To test the CLI in dev mode:

```bash
$ yarn dx help
```

## Installation

Install CLI globally:

```bash
$ yarn global add @dxos/cli@beta
```

or

```
$ npm install --global @dxos/cli@beta
```

### Extensions

In order to install CLI extensions, one could leverage automatic installation mechanism (for DXOS extensions only):

TODO(burdon): Rename registry.

```bash
$ dx registry
```

```bash
$ dx app
```

In order to install arbitrary extension, `dx extension install` command could be used:

```
$ dx extension install @dxos/cli-ipfs --version beta

✔ Installing @dxos/cli-ipfs@beta
```

View installed extensions: 

```
$ dx extension list

extension       command          version         description
--------------  ---------------  --------------  -----------------------
@dxos/cli-bot   bot              2.0.32          Bot operations.
@dxos/cli-app   app              2.0.32          Application management.
```

Uninstall extension:

```
$ dx extension uninstall @dxos/cli-ipfs

Found Extension @dxos/cli-ipfs@2.0.32 installed, do you wish to remove it? (Yes/No): y
✔ Uninstalling @dxos/cli-ipfs
```

## Upgrade

An older version of the CLI could be upgraded via `dx upgrade` command.

```
$ dx version
v2.0.30

$ dx upgrade --force
Found extensions: @dxos/cli-party, @dxos/cli-signal, @dxos/cli-bot, @dxos/cli-app
✔ Uninstalling @dxos/cli-party
✔ Uninstalling @dxos/cli-signal
✔ Uninstalling @dxos/cli-bot
✔ Uninstalling @dxos/cli-app
✔ Uninstalling @dxos/cli
✔ Installing @dxos/cli
✔ Installing @dxos/cli-app
✔ Installing @dxos/cli-bot
✔ Installing @dxos/cli-signal
✔ Installing @dxos/cli-party

$ dx version
v2.0.32
```

## Troubleshooting

Most of the weirdness in CLI behaviour could be caused by any combination of previously installed CLIs and extensions, especially from the beta channel;

Check latest available version:

```bash
$ yarn info @dxos/cli versions --json | jq '.data[-1]'
```

Check installed version:

```bash
$ dx version
```

If those outputs are different, make sure to remove old versions of `dx`.
Remove old CLI and extensions, installed globally.

To remove CLI and all extensions:

```
$ dx uninstall --npm-client yarn
```

To force upgrade CLI and all installed extensions to the latest:

```
$ dx upgrade --npm-client yarn --force
```

`--version` attribute could be supplied in order to upgrade/downgrade to a specific version.

## Setup

In order for CLI to support custom certificate authorities, one would need to import root CA certificate using `dx cert import` command. For the case of KUBE, import command would look like:

```bash
$ dx cert import --url https://apollo1.kube.moon.dxos.network/cert/kube.pem
```

Corresponding certificate would be downloaded to `~/.dx/certs` and considered by CLI as "trusted".

### Profiles

To use the CLI, a profile needs to be created and activated.

The CLI supports creating multiple profiles with different configurations from downloadable templates, and switching between them.

To create a profile from a template, pass a profile name and template URL.

Example:

```bash
$ dx profile init --name devnet-moon --template-url https://git.io/JUkhm
```

Profiles are stored in the `~/.dx/profile` folder. To further customize a profile, edit the profile configuration file.

To activate/use a profile, do one of the following (highest to lowest precedence):

1. Pass it as an argument to a command (`--profile <NAME>`), e.g. `dx --profile devnet registry status`
2. export `DX_PROFILE` in the shell, with the name of the profile, e.g. `export DX_PROFILE=devnet`
3. Set it as the default for the system, e.g. `dx profile set devnet`

Note: The first profile created automatically becomes the system default.

View the name of the active profile:

```bash
$ dx profile
```

View the configuration values for the active profile:

```bash
$ dx profile config
```

View the configuration values for a given profile:

```bash
$ dx profile config <NAME>
```

View the profile used for a command (using the `--dry-run` flag):

```bash
$ dx registry status --dry-run
Profile: /Users/ashwinp/.dx/profile/devnet.yml
```

Multiple templates can be created and shared with others to use different configuration values. Some [sample templates](./profiles/README.md) are included in the repo.

### Environment Variables

While the usage of ENV variables is minimized, CLI still uses DXNS related variables for configuration. Those variables are mapped to the canonical structure: [ENV mapping](env-map.yml)

ENV variables are also used to pass configuration between CLI and spawned processes, but this happens transparently for CLI user.

## Commands

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

## Extensions

| Extension |
| :------------ |
| [App CLI](https://github.com/dxos/cli/blob/master/packages/cli-app/README.md) |
| [Bot CLI](https://github.com/dxos/cli/blob/master/packages/cli-bot/README.md) |
| [Chat CLI](https://github.com/dxos/cli/blob/master/packages/cli-chat/README.md) |
| [Dashboard CLI](https://github.com/dxos/cli/blob/master/packages/cli-dashboard/README.md) |
| [ECHO CLI](https://github.com/dxos/cli/blob/master/packages/cli-echo/README.md) |
| [HALO CLI](https://github.com/dxos/cli/blob/master/packages/cli-halo/README.md) |
| [IPFS CLI](https://github.com/dxos/cli/blob/master/packages/cli-ipfs/README.md) |
| [Machine CLI](https://github.com/dxos/cli/blob/master/packages/cli-machine/README.md) |
| [MDNS CLI](https://github.com/dxos/cli/blob/master/packages/cli-mdns/README.md) |
| [Pad CLI](https://github.com/dxos/cli/blob/master/packages/cli-pad/README.md) |
| [Party CLI](https://github.com/dxos/cli/blob/master/packages/cli-party/README.md) |
| [Registry CLI](https://github.com/dxos/cli/blob/master/packages/cli-registry/README.md) |
| [Signal CLI](https://github.com/dxos/cli/blob/master/packages/cli-signal/README.md) |
