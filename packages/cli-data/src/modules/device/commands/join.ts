//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import queryString from 'query-string';
import { Argv, CommandModule, Arguments } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { DeviceOptions } from '../device';
import { InvitationDescriptor, InvitationDescriptorType } from '@dxos/echo-db';
import { Client } from '@dxos/client';
import { resetStorageForProfile } from '../../../config';
import { CliDataState } from '../../../init';

export interface DeviceJoinOptions extends DeviceOptions {
  invitation: string,
  passcode: string,
  hash: string,
  swarmKey: string,
  identityKey: string,
}

const options = (yargs: Argv<DeviceOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('invitation', { type: 'string', required: true })
    .option('hash', { type: 'string', required: true })
    .option('swarmKey', { type: 'string', required: true })
    .option('identityKey', { type: 'string', required: true })
    .option('passcode', { type: 'string', required: true });
};

export const joinCommand = ({stateManager, config, profilePath}: Pick<CliDataState, 'stateManager' | 'config' | 'profilePath'>): CommandModule<DeviceOptions, DeviceJoinOptions> => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { invitation, json, passcode, hash, swarmKey, identityKey } = argv;

    const client = await stateManager.getClient();
    const clientConfig = client.config
    if (client.initialized) {
      await client.destroy()
    }
    if (clientConfig.storage?.persistent) {
      assert(config, 'Missing config.')
      resetStorageForProfile(config.get('cli.storage.path'), profilePath!);
    }

    const newClient = new Client(clientConfig)
    await newClient.initialize()

    const invitationDescriptor = InvitationDescriptor.fromQueryParameters({
      hash,
      invitation,
      swarmKey,
      type: InvitationDescriptorType.INTERACTIVE,
      identityKey
    })
    await newClient.halo.join(invitationDescriptor, async () => Buffer.from(passcode))

    stateManager.replaceClient(newClient);
  })
});
