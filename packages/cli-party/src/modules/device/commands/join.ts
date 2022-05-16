//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Arguments, Argv } from 'yargs';

import { CLI_DEFAULT_PERSISTENT, asyncHandler, resetStorageForClientProfile } from '@dxos/cli-core';
import { InvitationDescriptor } from '@dxos/echo-db';

import { CliDataState } from '../../../init';
import { DeviceOptions } from '../device';

export interface DeviceJoinOptions extends DeviceOptions {
  code: string
  name: string
}

const options = (yargs: Argv<DeviceJoinOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('name', { type: 'string', required: true })
    .option('code', { type: 'string', required: true });
};

export const joinCommand = ({ stateManager, config, profilePath }: Pick<CliDataState, 'stateManager' | 'config' | 'profilePath' | 'getReadlineInterface'>, secretProvider: Function) => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: (yargs: Argv<any>) => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { code, name } = argv;
    if (stateManager.client) {
      throw new Error('Profile already initialized. Reset storage first. (`> storage reset`)');
    }

    const persistent = config?.get('runtime.client.storage.persistent', CLI_DEFAULT_PERSISTENT);
    if (persistent && !name) {
      throw new Error('Profile name is not provided.');
    }

    if (persistent) {
      assert(config, 'Missing config.');
      assert(profilePath, 'Missing profile path.');
      resetStorageForClientProfile(config.get('runtime.client.storage.path'), name);
    }

    // TODO - create profile folder & save as default?
    await stateManager.initializeClient({ name });
    const client = await stateManager.getClient();

    const invitationDescriptor = InvitationDescriptor.decode(code);

    const invitation = await client.halo.acceptInvitation(invitationDescriptor);
    const secret = await secretProvider();
    invitation.authenticate(secret);

    await invitation.wait();
  })
});
