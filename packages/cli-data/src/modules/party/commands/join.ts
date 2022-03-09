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
    .option('invitation', { type: 'string', alias: 'invitation-url' })
    .option('passcode', { type: 'string' });
};

export const joinCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyJoinOptions> => ({
  command: ['join [party-key]', 'switch [party-key]', 'use [party-key]'],
  describe: 'Join party.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<PartyJoinOptions>) => {
    const { partyKey, invitation, json, passcode } = argv;

    assert(partyKey || invitation, 'Invalid party.');

    let invite;
    if (invitation) {
      invite = InvitationDescriptor.decode(invitation.split('/').pop()!);
    }

    await stateManager.joinParty(partyKey, invite, passcode);

    if (partyKey && /^[0-9a-f]{64}$/i.test(partyKey)) {
      return print({ partyKey }, { json });
    }
  })
});
