//
// Copyright 2022 DXOS.org
//

import path from 'path';
import { Argv } from 'yargs';

import {
  CoreState,
  asyncHandler,
  createClient,
  listClientProfilePaths,
  useProfile,
  cleanSessionProfile,
  setProfile,
  print,
  getCurrentProfilePath
} from '@dxos/cli-core';

export const HaloModule = ({ config }: CoreState) => ({
  command: ['halo'],
  describe: 'HALO identity management.',
  builder: (yargs: Argv) => yargs

    .command({
      command: ['init'],
      describe: 'Init HALO identity.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Identity name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;

        cleanSessionProfile();

        const client = await createClient(config!, [], { name, initProfile: true });
        await client.destroy();
      })
    })

    .command({
      command: ['list'],
      describe: 'List HALO identities.',

      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;
        print(listClientProfilePaths(), { json });
      })
    })

    .command({
      command: ['use [name]'],
      describe: 'Switch HALO identity for current terminal session only.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Identity name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;
        useProfile(name);
      })
    })

    .command({
      command: ['set [name]'],
      describe: 'Set default HALO identity.',

      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Identity name', required: true }),

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;
        setProfile(name);
      })
    }),

  handler: asyncHandler(async () => {
    print(path.basename(getCurrentProfilePath()));
  })
});
