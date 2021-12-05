//
// Copyright 2020 DXOS.org
//
import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import { defaultSecretValidator, generatePasscode } from '@dxos/credentials';
import { InvitationDescriptorType } from '@dxos/echo-db';

import { StateManager } from '../../../state-manager';
import { encodeInvitation } from '../../../utils';
import { DeviceOptions } from '../device';

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }); // override the default.
};

export const inviteCommand = (stateManager: StateManager): CommandModule<DeviceOptions, DeviceOptions> => ({
  command: ['invite'],
  describe: 'Invite another device.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceOptions>) => {
    const passcode = generatePasscode();
    const client = await stateManager.getClient();
    const invitation = await client.echo.halo.createInvitation({
      secretProvider: async () => Buffer.from(passcode),
      secretValidator: defaultSecretValidator
    });

    const result = {
      invitation: invitation.toQueryParameters().invitation,
      hash: invitation.toQueryParameters().hash,
      swarmKey: invitation.toQueryParameters().swarmKey,
      identityKey: invitation.identityKey?.toHex(),
      type: InvitationDescriptorType.INTERACTIVE
    };
    const code = encodeInvitation(result);
    return print({ code, passcode }, argv);
  })
});
