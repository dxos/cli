//
// Copyright 2020 DXOS.org
//

import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '../device';

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }); // override the default.
};

export const inviteCommand = (stateManager: StateManager, onPinGenerated: (pin: string) => void, onGenerated?: (code: string) => void): CommandModule<DeviceOptions, DeviceOptions> => ({
  command: ['invite'],
  describe: 'Invite another device.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const client = await stateManager.getClient();

    const invitation = await client.halo.createInvitation();
    invitation.connected.on(() => onPinGenerated(invitation.descriptor.secret?.toString() ?? ''));

    onGenerated && await onGenerated(invitation.descriptor.encode());

    print({ code: invitation.descriptor.encode() }, argv);
  })
});
