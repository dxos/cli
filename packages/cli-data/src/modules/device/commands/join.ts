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

export interface DeviceJoinOptions extends DeviceOptions {
  invitation: string,
  passcode: string,
  hash: string,
  swarmKey: string,
  identityKey: string,
}

const partyOptions = (yargs: Argv<DeviceOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('invitation', { type: 'string', required: true })
    .option('hash', { type: 'string', required: true })
    .option('swarmKey', { type: 'string', required: true })
    .option('identityKey', { type: 'string', required: true })
    .option('passcode', { type: 'string', required: true });
};

export const joinCommand = (stateManager: StateManager): CommandModule<DeviceOptions, DeviceJoinOptions> => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: yargs => partyOptions(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { invitation, json, passcode, hash, swarmKey, identityKey } = argv;

    const client = await stateManager.getClient();
    const config = client.config
    await client.reset()

    const newClient = new Client(config)
    await newClient.initialize()

    // await client.initialize();

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
