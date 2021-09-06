//
// Copyright 2020 DXOS.org
//
import assert from 'assert';
import path from 'path';
import queryString from 'query-string';
import { Argv, CommandModule, Arguments } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '../device';
import { defaultSecretValidator, generatePasscode } from '@dxos/credentials';

export interface DeviceInviteOptions extends DeviceOptions {
}

const partyOptions = (yargs: Argv<DeviceOptions>): Argv<DeviceInviteOptions> => {
  return yargs
};

export const inviteCommand = (stateManager: StateManager): CommandModule => ({
  command: ['invite'],
  describe: 'Invite another device.',
  builder: yargs => partyOptions(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceInviteOptions>) => {
    const {json} = argv;

    const passcode = generatePasscode();
    const client = await stateManager.getClient();
    const invitation = await client.halo.createInvitation({
      secretProvider: async () => Buffer.from(passcode),
      secretValidator: defaultSecretValidator
    })
    const result = {
      invitation: invitation.toQueryParameters().invitation,
      passcode,
      identityKey: invitation.identityKey?.toHex()
    }
    print(result, { json });
    return result;
  })
});
