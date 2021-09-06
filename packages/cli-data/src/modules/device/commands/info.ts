//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '..';

export const infoCommand = (stateManager: StateManager): CommandModule => ({
  command: ['info'],
  describe: 'Current device info.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const { json } = argv;

    const client = await stateManager.getClient();
    
    const data = {
      displayName: client.halo.identity.displayName,
      identityKey: client.halo.identity.identityKey?.publicKey.toHex(),
      deviceKey: client.halo.identity.deviceKey?.publicKey.toHex(),
    }

    print(data, { json });
    return data;
  })
});
