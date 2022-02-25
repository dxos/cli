---
title: Create your profile
description: Identify yourself
---

## Profiles

To use the CLI, a profile needs to be created and activated.

The CLI supports creating multiple profiles with different configurations from downloadable templates, and switching between them.

To create a profile from a template, pass a profile name and template URL.

Example:

```bash
dx profile init --name enterprise --template-url https://bit.ly/3A642xB
dx profile set enterprise
```

Profiles are stored in the `~/.dx/profile` folder. To further customize a profile, edit the profile configuration file.

To activate/use a profile, do one of the following (highest to lowest precedence):

1. Pass it as an argument to a command (`--profile <NAME>`), e.g., `dx --profile enterprise extension list`
2. export `DX_PROFILE` in the shell, with the name of the profile, e.g., `export DX_PROFILE=enterprise`
3. Set it as the default for the system, e.g., `dx profile set enterprise`

Note: The first profile created automatically becomes the system default.

View the name of the active profile:

```bash
dx profile
```

View the configuration values for the active profile:

```bash
dx profile config
```

View the configuration values for a given profile:

```bash
dx profile config <NAME>
```

Multiple templates can be created and shared with others to use different configuration values. Some [sample templates](https://github.com/dxos/cli/tree/main/packages/cli/profiles) are included in the repo.