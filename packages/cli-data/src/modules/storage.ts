//
// Copyright 2020 DXOS.org
//

import { Arguments, Argv } from 'yargs';

import { asyncHandler, CoreOptions } from '@dxos/cli-core';

import { CLI_DEFAULT_PERSISTENT, resetStorage, resetStorageForProfile } from '../config';
import { CliDataState } from '../init';
export interface StorageOptions extends CoreOptions {
  all?: boolean
}

const storageOptions = (yargs: Argv<CoreOptions>): Argv<StorageOptions> => {
  return yargs
    .option('all', { type: 'boolean', default: false });
};

/**
 * Storage CLI module.
 */
export const StorageModule = ({ config, cliState, profilePath }: CliDataState) => ({
  command: ['storage'],
  describe: 'Storage management.',

  builder: (yargs: Argv<CoreOptions>) => yargs

    // Import.
    .command({
      command: ['reset'],
      describe: 'Reset storage for all or current profiles.',
      builder: yargs => storageOptions(yargs),
      handler: asyncHandler(async (argv: Arguments<StorageOptions>) => {
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
          resetStorageForProfile(config.get('cli.storage.path'), profilePath!);
        }
      })
    })
});
