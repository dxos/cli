//
// Copyright 2020 DXOS.org
//
import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import { defaultSecretValidator, generatePasscode } from '@dxos/credentials';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '../device';

export interface DeviceInviteOptions extends DeviceOptions {
  stringify?: boolean,
}

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceInviteOptions> => {
  return yargs
    .option('stringify', {type: 'boolean'});
};

export const inviteCommand = (stateManager: StateManager): CommandModule<DeviceOptions, DeviceInviteOptions> => ({
  command: ['invite'],
  describe: 'Invite another device.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceInviteOptions>) => {
    const passcode = generatePasscode();
    const client = await stateManager.getClient();
    const invitation = await client.halo.createInvitation({
      secretProvider: async () => Buffer.from(passcode),
      secretValidator: defaultSecretValidator
    });
    const result = {
      invitation: invitation.toQueryParameters().invitation,
      hash: invitation.toQueryParameters().hash,
      swarmKey: invitation.toQueryParameters().swarmKey,
      passcode,
      identityKey: invitation.identityKey?.toHex()

    };
    return print(argv.stringify ? JSON.stringify(result) : result, argv);
  })
});
