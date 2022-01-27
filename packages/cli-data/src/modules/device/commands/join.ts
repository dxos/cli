//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import { InvitationDescriptor } from '@dxos/echo-db';

import { CLI_DEFAULT_PERSISTENT, resetStorageForProfile } from '../../../config';
import { CliDataState } from '../../../init';
import { DeviceOptions } from '../device';

export interface DeviceJoinOptions extends DeviceOptions {
  code: string
}

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('code', { type: 'string', required: true });
};

export const joinCommand = ({ stateManager, config, profilePath }: Pick<CliDataState, 'stateManager' | 'config' | 'profilePath' | 'getReadlineInterface'>, secretProvider: Function): CommandModule<DeviceOptions, DeviceJoinOptions> => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { code } = argv;
    if (stateManager.client) {
      throw new Error('Profile already initialized. Reset storage first. (`> storage reset`)');
    }

    if (config?.get('runtime.client.storage.persistent', CLI_DEFAULT_PERSISTENT)) {
      assert(config, 'Missing config.');
      assert(profilePath, 'Missing profile path.');
      resetStorageForProfile(config.get('runtime.client.storage.path'), profilePath);
    }

    await stateManager.initializeClient({ initProfile: false });
    const client = await stateManager.getClient();

    const invitationDescriptor = InvitationDescriptor.decode(code);

    const invitation = await client.halo.acceptInvitation(invitationDescriptor);
    const secret = await secretProvider();
    invitation.authenticate(secret);

    await invitation.wait();
  })
});
