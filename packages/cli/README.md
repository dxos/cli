# DXOS CLI

General information about DXOS CLI can be found [here](../../README.md)

## Usage

### Profiles

To use the CLI, a profile needs to be created and activated.

The CLI supports creating multiple profiles with different configurations from downloadable templates, and switching between them.

To create a profile from a template, pass a profile name and template URL.

Example:

```bash
$ dx profile init --name enterprise --template-url https://git.io/JKpLV
```

Profiles are stored in the `~/.dx/profile` folder. To further customize a profile, edit the profile configuration file.

To activate/use a profile, do one of the following (highest to lowest precedence):

1. Pass it as an argument to a command (`--profile <NAME>`), e.g. `dx --profile enterprise wns status`
2. export `WIRE_PROFILE` in the shell, with the name of the profile, e.g. `export WIRE_PROFILE=enterprise`
3. Set it as the default for the system, e.g. `dx profile set enterprise`

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
$ dx wns status --dry-run
Profile: /Users/ashwinp/.dx/profile/devnet.yml
```

Multiple templates can be created and shared with others to use different configuration values. Some [sample templates](./profiles/README.md) are included in the repo.

### Extensions

In order to install CLI extensions, one could leverage automatic installation mechanism (for DXOS extensions only):

<!--TODO(burdon): Rename registry.-->

```bash
$ dx wns
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

extension       command  version       description
--------------  -------  ------------  -----------------------
@dxos/cli-app   app      1.0.1-beta.1  Application management.
@dxos/cli-bot   bot      1.0.1-beta.1  Bot operations.
@dxos/cli-ipfs  ipfs     1.0.1-beta.2  IPFS operations.
```

Uninstall extension:

```
$ dx extension uninstall @dxos/cli-ipfs

Found Extension @dxos/cli-ipfs@1.0.1-beta.2 installed, do you wish to remove it? (Yes/No): y
✔ Uninstalling @dxos/cli-ipfs
```

#### Available Extensions

| Extension |
| :------------ |
| [App CLI](../cli-app/README.md) |
| [Bot CLI](../cli-bot/README.md) |
| [Chat CLI](../cli-chat/README.md) |
| [Console CLI](../cli-console/README.md) |
| [Data CLI](../cli-data/README.md) |
| [DXNS CLI](../cli-dxns/README.md) |
| [ECHO CLI](../cli-echo/README.md) |
| [HALO CLI](../cli-halo/README.md) |
| [IPFS CLI](../cli-ipfs/README.md) |
| [KUBE CLI](../cli-kube/README.md) |
| [MDNS CLI](../cli-mdns/README.md) |
| [Mesh CLI](../cli-mesh/README.md) |
| [Pad CLI](../cli-pad/README.md) |
| [Signal CLI](../cli-signal/README.md) |
| [WNS CLI](../cli-wns/README.md) |


### Certification

In order for CLI to support custom certificate authorities, one would need to import root CA certificate using `dx cert import` command. For the case of XBOX, import command would look like:

```bash
$ dx cert import --url https://kube.local/kube.pem
```

<!--TODO(egor): Host cert on .well-known endpoint.-->

Corresponding certificate would be downloaded to `~/.dx/certs` and considered by CLI as "trusted".

## Development

### Dependencies

- [yarn](https://yarnpkg.com/)
- [jq](https://stedolan.github.io/jq/)

### Setup

```bash
# CLI is a yarn monorepo

# Install dependencies
yarn

# Build all packages
yarn build
```

### Running commands locally

During local development there is a need for testing of a newly created / modified commands. For that purpose, any cli command could be called from the repo root via `yarn dx`, e.g.:

```
yarn dx dxns resource list --json
```

If the command ought to be called from the specific path (e.g. during app deployent), an alias for the local dx binary coud be created by adding such to the shell profile:

```
alias dx-local='node ~/path/to/cli/packages/cli/bin/dx.js'
```

Then, all commands could be called via `dx-local` in any directory, like:

```
dx-local dxns resource list --json
```

### Environment Variables

While the usage of ENV variables is minimized, in some edge cases CLI still uses ENV variables for configuration. Those variables are mapped to the canonical structure: [ENV mapping](../cli-core/src/env-map.json)

ENV variables are also used to pass configuration between CLI and spawned processes, but this happens transparently for CLI user.

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

If those outputs are different, make sure to remove old versions of `wire`.
Remove old CLI and extensions, installed globally.

For that purpose `dx uninstall` and `dx upgrade` commands are available.

To remove CLI and all extensions:

```
$ dx uninstall --npm-client yarn
```

To force upgrade CLI and all installed extensions to the latest:

```
$ dx upgrade --npm-client yarn --force
```

`--version` attribute could be supplied in order to upgrade/downgrade to a specific version.
