//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import { Client } from '@dxos/client';

import { resetStorageForProfile } from '../../../config';
import { CliDataState } from '../../../init';
import { decodeInvitation } from '../../../utils';
import { DeviceOptions } from '../device';

export interface DeviceJoinOptions extends DeviceOptions {
  code: string,
  passcode: string
}

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('code', { type: 'string', required: true })
    .option('passcode', { type: 'string', required: true });
};

export const joinCommand = ({ stateManager, config, profilePath }: Pick<CliDataState, 'stateManager' | 'config' | 'profilePath'>): CommandModule<DeviceOptions, DeviceJoinOptions> => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { code, passcode } = argv;

    const client = await stateManager.getClient();
    const clientConfig = client.config;
    if (client.initialized) {
      await client.destroy();
    }
    if (clientConfig.storage?.persistent) {
      assert(config, 'Missing config.');
      resetStorageForProfile(config.get('cli.storage.path'), profilePath!);
    }

    const newClient = new Client(clientConfig);
    await newClient.initialize();

    const invitationDescriptor = decodeInvitation(code);
    await newClient.halo.join(invitationDescriptor, async () => Buffer.from(passcode));

    stateManager.replaceClient(newClient);
  })
});
