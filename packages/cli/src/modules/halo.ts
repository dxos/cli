//
// Copyright 2022 DXOS.org
//

import { Argv } from 'yargs';

import {
  CoreState,
  asyncHandler,
  createClient,
  listClientProfilePaths,
  useProfile,
  cleanSessionProfile,
  setProfile,
  print
} from '@dxos/cli-core';

export const HaloModule = ({ config }: CoreState) => ({
  command: ['halo'],
  describe: 'HALO identity management.',
  builder: (yargs: Argv) => yargs

    .command({
      command: ['init'],
      describe: 'Init HALO profile.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;

        cleanSessionProfile();

        const client = await createClient(config!, [], { name, initProfile: true });
        await client.destroy();
      })
    })

    .command({
      command: ['list'],
      describe: 'List HALO profiles.',

      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;
        print(listClientProfilePaths(), { json });
      })
    })

    .command({
      command: ['use [name]'],
      describe: 'Switch HALO profile for current terminal session only.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;
        useProfile(name);
      })
    })

    .command({
      command: ['set [name]'],
      describe: 'Set default HALO profile.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;
        setProfile(name);
      })
    })
});
