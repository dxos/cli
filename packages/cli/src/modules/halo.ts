//
// Copyright 2022 DXOS.org
//

import { Argv } from 'yargs';

import { CLI_DEFAULT_PERSISTENT, CoreState, asyncHandler, createClient, listClientProfiles, print } from '@dxos/cli-core';

// import { log } from '@dxos/debug';

export const HaloModule = ({ config }: CoreState) => ({
  command: ['halo'],
  describe: 'HALO operations.',
  builder: (yargs: Argv) => yargs

    .command({
      command: ['init'],
      describe: 'Init HALO profile.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name' }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;
        const client = await createClient(config!, [], { persistent: config!.get('runtime.client.storage.persistent') || CLI_DEFAULT_PERSISTENT, name, initProfile: true });
        await client.destroy();
      })
    })

    .command({
      command: ['list'],
      describe: 'List HALO profiles.',

      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;
        print(listClientProfiles(), { json })
      })
    })
});
