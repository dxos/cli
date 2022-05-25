//
// Copyright 2020 DXOS.org
//

import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import type { Client } from '@dxos/client';

import { DeviceOptions } from '../device';

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }); // override the default.
};

type DeviceInviteOptions = {
  getClient: (name?: string) => Promise<Client>
}

export const inviteCommand = ({ getClient }: DeviceInviteOptions, onPinGenerated: (pin: string) => void, onGenerated?: (code: string) => void): CommandModule<DeviceOptions, DeviceOptions> => ({
  command: ['invite'],
  describe: 'Invite another device.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const client = await getClient();

    const invitation = await client.halo.createInvitation();
    invitation.connected.on(() => onPinGenerated(invitation.descriptor.secret?.toString() ?? ''));

    onGenerated && await onGenerated(invitation.descriptor.encode());

    print({ code: invitation.descriptor.encode() }, argv);
  })
});
