//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '..';

export const listCommand = (stateManager: StateManager): CommandModule => ({
  command: ['list'],
  describe: 'List devices.',
  builder: yargs => yargs,

  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const { json } = argv;

    const client = await stateManager.getClient();
    // const devices = client.halo.identity.halo.dev

    // print(parties, { json });
    // return parties;
  })
});
