# DXOS CLI

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

In order to install CLI extensions, one could leverage automatic installation mechanism (for DxOS extensions only):

```bash
$ wire wns
```

```bash
$ wire app
```

In order to install arbitrary extension, `wire extension install` command could be used:

```
$ wire extension install @dxos/cli-ipfs --version beta

✔ Installing @dxos/cli-ipfs@beta
```

View installed extensions: 

```
$ wire extension list

extension       command  version       description
--------------  -------  ------------  -----------------------
@dxos/cli-app   app      1.0.1-beta.1  Application management.
@dxos/cli-bot   bot      1.0.1-beta.1  Bot operations.
@dxos/cli-ipfs  ipfs     1.0.1-beta.2  IPFS operations.
```

Uninstall extension:

```
$ wire extension uninstall @dxos/cli-ipfs

Found Extension @dxos/cli-ipfs@1.0.1-beta.2 installed, do you wish to remove it? (Yes/No): y
✔ Uninstalling @dxos/cli-ipfs
```

## Upgrade

An older version of DxOS CLI could be upgraded via `wire upgrade` command.

```
$wire version
v1.0.0-beta.32

$ wire upgrade --npm-client yarn --force
Found extensions: @dxos/app-cli, @dxos/bot-cli, @dxos/dashboard-cli, @dxos/data-cli, @dxos/ipfs-cli, @dxos/signal-cli, @wirelineio/wns-cli
✔ Removing @dxos/app-cli
✔ Removing @dxos/bot-cli
✔ Removing @dxos/dashboard-cli
✔ Removing @dxos/data-cli
✔ Removing @dxos/ipfs-cli
✔ Removing @dxos/signal-cli
✔ Removing @wirelineio/wns-cli
✔ Removing @dxos/cli
✔ Installing @dxos/cli@beta
✔ Installing @dxos/app-cli@beta
✔ Installing @dxos/bot-cli@beta
✔ Installing @dxos/dashboard-cli@beta
✔ Installing @dxos/data-cli@beta
✔ Installing @dxos/ipfs-cli@beta
✔ Installing @dxos/signal-cli@beta
✔ Installing @wirelineio/wns-cli@beta

$ wire version
v1.0.0-beta.33
```

## Troubleshooting

Most of the weirdness in CLI behaviour could be caused by any combination of previously installed CLIs and extensions, especially from the beta channel;

Check latest available version:

```bash
$ yarn info @dxos/cli versions --json | jq '.data[-1]'
```

Check installed version:

```bash
$ wire version
```

If those outputs are different, make sure to remove old versions of `wire`.
Remove old CLI and extensions, installed globally.

Starting v1.0.0-beta.30, `wire uninstall` and `wire upgrade` commands are available.

To remove CLI and all extensions:

```
$ wire uninstall --npm-client yarn
```

To force upgrade CLI and all installed extensions to the latest:

```
$ wire upgrade --npm-client yarn --force
```

`--version` attribute could be supplied in order to upgrade/downgrade to a specific version.

## Setup

In order for CLI to support custom certificate authorities, one would need to import root CA certificate using `wire cert import` command. For the case of XBOX, import command would look like:

```bash
$ wire cert import --url https://xbox.local/xbox.pem
```

TODO(egor): Host cert on .well-known endpoint.

Corresponding certificate would be downloaded to `~/.wire/certs` and considered by CLI as "trusted".

### Profiles

To use the CLI, a profile needs to be created and activated.

The CLI supports creating multiple profiles with different configurations from downloadable templates, and switching between them.

To create a profile from a template, pass a profile name and template URL.

Example:

```bash
$ wire profile init --name devnet --template-url https://git.io/Jfrn4
```

Profiles are stored in the `~/.wire/profile` folder. To further customize a profile, edit the profile configuration file.

To activate/use a profile, do one of the following (highest to lowest precedence):

1. Pass it as an argument to a command (`--profile <NAME>`), e.g. `wire --profile devnet wns status`
2. export `WIRE_PROFILE` in the shell, with the name of the profile, e.g. `export WIRE_PROFILE=devnet`
3. Set it as the default for the system, e.g. `wire profile set devnet`

Note: The first profile created automatically becomes the system default.

View the name of the active profile:

```bash
$ wire profile
```

View the configuration values for the active profile:

```bash
$ wire profile config
```

View the configuration values for a given profile:

```bash
$ wire profile config <NAME>
```

View the profile used for a command (using the `--dry-run` flag):

```bash
$ wire wns status --dry-run
Profile: /Users/ashwinp/.wire/profile/devnet.yml
```

Multiple templates can be created and shared with others to use different configuration values. Some [sample templates](./profiles/README.md) are included in the repo.

### Account Setup

Registering records in WNS requires an account. To create an account, activate the required profile and run the following command:

```bash
$ wire wns account create
? Post a Tweet with text 'Fund cosmos1jeh4d8ym99t235p22n6j4lyyf9wk56jgzjq9dk' and paste the URL: "<PASTE TWEET URL HERE>"
Requesting funds from faucet...
Got funds from faucet:
[
  {
    "type": "uwire",
    "quantity": 1000000000
  }
]
Creating a bond...
Bond created successfully.
Account created successfully. Copy the mnemonic to another safe location.
There is no way to recover the account and associated funds if this mnemonic is lost.
{
  "mnemonic": "rely lounge lock never tuition relax ostrich depth clever pill clap express",
  "privateKey": "87bb801596815239cc79c0e62f76d0f94a0c6be25e9cfcc13f7297ed01db3794",
  "publicKey": "02c65789582ad62e527e1fcd1d267aad79864dd2e8bfbb19bce90997fe630aa3ac",
  "address": "cosmos1jeh4d8ym99t235p22n6j4lyyf9wk56jgzjq9dk",
  "bondId": "0b73fdcbbf7033c51c405cbcb4498ddcf1a9c6b6d17873e22db34f39e3f3ca3c"
}
Mnemonic saved to ~/.wire/profile/devnet.secrets.yml
```

The profile configuration file is automatically updated with the WNS account private key and bond.

### Environment Variables

While the usage of ENV variables is minimized, CLI still uses WNS related variables for configuration. Those variables are mapped to the canonical structure: [ENV mapping](env-map.yml)

ENV variables are also used to pass configuration between CLI and spawned processes, but this happens transparently for CLI user.

## Commands

All the CLI modules support `help` flag that provides desired command clarification, e.g.

```bash
$ wire help
```

```bash
$ wire app help
```

```bash
$ wire app register help
```

## Extensions

| Extension |
| :------------ |
| [App CLI](https://github.com/dxos/cli/blob/master/packages/cli-app/README.md) |
| [Bot CLI](https://github.com/dxos/cli/blob/master/packages/cli-bot/README.md) |
| [Dashboard CLI](https://github.com/dxos/cli/blob/master/packages/cli-dashboard/README.md) |
| [Data CLI](https://github.com/dxos/cli/blob/master/packages/cli-data/README.md) |
| [IPFS CLI](https://github.com/dxos/cli/blob/master/packages/cli-ipfs/README.md) |
| [Machine CLI](https://github.com/dxos/cli/blob/master/packages/cli-machine/README.md) |
| [MDNS CLI](https://github.com/dxos/cli/blob/master/packages/cli-mdns/README.md) |
| [Pad CLI](https://github.com/dxos/cli/blob/master/packages/cli-pad/README.md) |
| [Peer CLI](https://github.com/dxos/cli/blob/master/packages/cli-peer/README.md) |
| [Resource CLI](https://github.com/dxos/cli/blob/master/packages/cli-resource/README.md) |
| [Signal CLI](https://github.com/dxos/cli/blob/master/packages/cli-signal/README.md) |
| [WNS CLI](https://github.com/dxos/cli/blob/master/packages/cli-wns/README.md) |
| [XBox CLI](https://github.com/dxos/cli/blob/master/packages/cli-xbox/README.md) |