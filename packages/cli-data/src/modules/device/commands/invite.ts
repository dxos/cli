//
// Copyright 2020 DXOS.org
//

import { Arguments, Argv, CommandModule } from 'yargs';

import { log } from '@dxos/debug';
import { asyncHandler, print } from '@dxos/cli-core';

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

    let onFinish;
    const invitationIsFinished = new Promise(resolve => onFinish = resolve);

    const invitation = await client.createHaloInvitation({
      onFinish,
      onPinGenerated
    });

    onGenerated && await onGenerated(invitation.invitationCode);

    print({ code: invitation.invitationCode }, argv);

    log('Waiting for another device to join...');

    await invitationIsFinished;
  })
});
