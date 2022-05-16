//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { DeviceOptions } from '..';
import { StateManager } from '../../../state-manager';

export const infoCommand = (stateManager: StateManager): CommandModule<DeviceOptions, DeviceOptions> => ({
  command: ['info'],
  describe: 'Current device info.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const client = await stateManager.getClient();

    const data = {
      displayName: client.halo.profile?.username
      // identityKey: client.echo.halo.identity.identityKey?.publicKey.toHex(),
      // deviceKey: client.echo.halo.identity.deviceKey?.publicKey.toHex()
    };

    return print(data, argv);
  })
});
