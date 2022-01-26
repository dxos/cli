//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Argv, CommandModule, Arguments } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';
import { InvitationDescriptor } from '@dxos/echo-db';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export interface PartyJoinOptions extends PartyOptions {
  invitation?: string,
  passcode?: string,
  invitationUrl?: string
}

const options = (yargs: Argv<PartyOptions>): Argv<PartyJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('invitation', { type: 'string' })
    .option('passcode', { type: 'string' })
    .option('invitation-url', { type: 'string' });
};

export const joinCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyJoinOptions> => ({
  command: ['join [party-key]', 'switch [party-key]', 'use [party-key]'],
  describe: 'Join party.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<PartyJoinOptions>) => {
    const { partyKey, invitationUrl, invitation, json, passcode } = argv;

    assert(partyKey || invitation || invitationUrl, 'Invalid party.');

    console.log('invitation', typeof invitation, {invitation})

    let invite = undefined;
    if (invitation) {
      invite = InvitationDescriptor.decode(invitation);
    } else if (invitationUrl) {
      invite = InvitationDescriptor.decode(invitationUrl.split('/').pop()!);
    }

    await stateManager.joinParty(partyKey, invite, passcode);

    if (partyKey && /^[0-9a-f]{64}$/i.test(partyKey)) {
      return print({ partyKey }, { json });
    }
  })
});
