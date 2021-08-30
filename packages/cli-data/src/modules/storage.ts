//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { CLI_DEFAULT_PERSISTENT, resetStorage, resetStorageForProfile } from '../config';

interface Params {
  config: any,
  cliState: any,
  profilePath: string
}

/**
 * Storage CLI module.
 */
export const StorageModule = ({ config, cliState, profilePath }: Params) => ({
  command: ['storage'],
  describe: 'Storage management.',

  builder: (yargs: Argv) => yargs

    // Import.
    .command({
      command: ['reset'],
      describe: 'Reset storage for all or current profiles.',
      builder: yargs => yargs
        .option('all', { type: 'boolean', default: false }),

      handler: asyncHandler(async (argv: any) => {
        const { all } = argv;

        const { interactive } = cliState;
        const persistent = config.get('cli.storage.persistent', CLI_DEFAULT_PERSISTENT);

        if (interactive) {
          throw new Error('Unable to reset storage inside interactive mode.');
        }

        if (all) {
          resetStorage();
        } else {
          if (!persistent) {
            throw new Error('Persistent storage was not used for current profile.');
          }
          resetStorageForProfile(config.get('cli.storage.path'), profilePath);
        }
      })
    })
});
