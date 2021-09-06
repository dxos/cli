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

export interface DeviceJoinOptions extends DeviceOptions {
  invitation: string,
  passcode: string,
  hash: string,
  swarmKey: string
}

const partyOptions = (yargs: Argv<DeviceOptions>): Argv<DeviceJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('invitation', { type: 'string', required: true })
    .option('hash', { type: 'string', required: true })
    .option('swarmKey', { type: 'string', required: true })
    .option('passcode', { type: 'string', required: true });
};

export const joinCommand = (stateManager: StateManager): CommandModule<DeviceOptions, DeviceJoinOptions> => ({
  command: ['join'],
  describe: 'Join device invitation.',
  builder: yargs => partyOptions(yargs),
  handler: asyncHandler(async (argv: Arguments<DeviceJoinOptions>) => {
    const { invitation, json, passcode, hash, swarmKey } = argv;

    const client = await stateManager.getClient();
    const invitationDescriptor = InvitationDescriptor.fromQueryParameters({
      hash,
      invitation,
      swarmKey,
      type: InvitationDescriptorType.INTERACTIVE,
    })
    await client.halo.join(invitationDescriptor, async () => Buffer.from(passcode))
  })
});
