//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { addDeviceToAccount, createAccount, listAccount, listAllAccount, listDevices } from '../../handlers/account';
import { Params } from '../../interfaces';

export const accountCommand = (params: Params): CommandModule => ({
  command: ['account'],
  describe: 'DXNS Account commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List DXNS Accounts.',
      handler: asyncHandler(listAccount(params))
    })
    .command({
      command: ['list-all'],
      describe: 'List all DXNS Accounts existing on the blockchain.',
      handler: asyncHandler(listAllAccount(params))
    })
    .command({
      command: ['create'],
      describe: 'Create new DXNS account.',
      handler: asyncHandler(createAccount(params))
    })
    .command({
      command: ['add-device'],
      describe: 'Add a new device to an existing DXNS account.',
      builder: yargs => yargs
        .option('device', { type: 'string', array: true }),
      handler: asyncHandler(addDeviceToAccount(params))
    })
    .command({
      command: ['list-devices'],
      describe: 'List devices of the DXNS account.',
      builder: yargs => yargs,
      handler: asyncHandler(listDevices(params))
    })
});
