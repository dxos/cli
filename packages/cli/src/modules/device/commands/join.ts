//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import { Arguments, Argv } from 'yargs';

import { CLI_DEFAULT_PERSISTENT, CoreState, asyncHandler, resetStorageForClientProfile } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { InvitationDescriptor } from '@dxos/echo-db';

import { DeviceOptions } from '../device';

type DeviceJoinCommandOptions = Pick<CoreState, | 'profilePath' | 'cliState'> & {
  getClient: (name?: string) => Promise<Client>
  storage?: {
    persistent?: boolean
    path?: string
  }
}

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

export const joinCommand = ({ storage, profilePath, cliState, getClient }: DeviceJoinCommandOptions, secretProvider: Function) => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: (yargs: Argv<any>) => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { code, name } = argv;
    if (cliState.interactive) {
      throw new Error('Can not join from interactive mode.');
    }

    const persistent = storage?.persistent ?? CLI_DEFAULT_PERSISTENT;
    if (persistent && !name) {
      throw new Error('Profile name is not provided.');
    }

    if (persistent) {
      assert(profilePath, 'Missing profile path.');
      resetStorageForClientProfile(storage?.path, name);
    }

    const client = await getClient(name);

    const invitationDescriptor = InvitationDescriptor.decode(code);

    const invitation = await client.halo.acceptInvitation(invitationDescriptor);
    const secret = await secretProvider();
    invitation.authenticate(secret);

    await invitation.wait();
  })
});
