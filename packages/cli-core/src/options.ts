//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

export const FORWARD_OPTION = 'forward';

export interface CoreOptions {
  verbose?: boolean,
  json?: boolean,
  dryRun?: boolean,
  profile?: string,
  [FORWARD_OPTION]?: string,
  mnemonic?: (string | number)[],
  interactive?: boolean,
}

export const coreOptions = (yargs: Argv<{}>): Argv<CoreOptions> => {
  return yargs
    .option({
      verbose: {
        description: 'Verbose output',
        demand: false,
        default: false,
        type: 'boolean',
        alias: 'v'
      }
    })

    .option({
      json: {
        description: 'JSON output',
        demand: false,
        default: false,
        type: 'boolean'
      }
    })

    .option('dry-run', {
      description: 'Dry run',
      demand: false,
      default: false,
      type: 'boolean'
    })

    .option('profile', {
      description: 'Sets the profile',
      demand: false,
      type: 'string'
    })

  // Args to pass through to underlying binary (e.g. registry, signal, etc.).
    .option({
      [FORWARD_OPTION]: {
        type: 'string',
        hidden: true
      }
    })

  // Special case - required for extensions.
    .option('mnemonic', {
      type: 'array',
      hidden: true
    })

    .option('interactive', { hidden: true, default: true });
};
