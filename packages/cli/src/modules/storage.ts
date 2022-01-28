//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import { Arguments, Argv } from 'yargs';

import { asyncHandler, CoreOptions, CoreState, CLI_DEFAULT_PERSISTENT, resetStorage, resetStorageForClientProfile } from '@dxos/cli-core';

export interface StorageOptions extends CoreOptions {
  all?: boolean,
  name?: string
}

const storageOptions = (yargs: Argv<CoreOptions>): Argv<StorageOptions> => {
  return yargs
    .option('name', { type: 'string' })
    .option('all', { type: 'boolean', default: false });
};

/**
 * Storage CLI module.
 */
export const StorageModule = ({ config, cliState }: CoreState) => ({
  command: ['storage'],
  describe: 'Storage management.',

  builder: (yargs: Argv<CoreOptions>) => yargs

    // Import.
    .command({
      command: ['reset'],
      describe: 'Reset storage for all or current profiles.',
      builder: yargs => storageOptions(yargs),
      handler: asyncHandler(async (argv: Arguments<StorageOptions>) => {
        const { name, all } = argv;
        assert(config, 'Missing config.');

        const { interactive } = cliState;
        const persistent = config.get('runtime.client.storage.persistent', CLI_DEFAULT_PERSISTENT);

        if (interactive) {
          throw new Error('Unable to reset storage inside interactive mode.');
        }

        if (all) {
          resetStorage();
        } else {
          if (!persistent) {
            throw new Error('Persistent storage was not used for current profile.');
          }
          resetStorageForClientProfile(config.get('runtime.client.storage.path'), name);
        }
      })
    })
});
