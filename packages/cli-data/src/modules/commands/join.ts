//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import queryString from 'query-string';
import { Argv, CommandModule, Arguments } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export interface PartyJoinOptions extends PartyOptions {
  invitation?: string,
  passcode?: string,
  invitationUrl?: string
}

const partyOptions = (yargs: Argv<PartyOptions>): Argv<PartyJoinOptions> => {
  return yargs
    .option('interactive', { hidden: true, default: true }) // override the default.
    .option('invitation', { type: 'string' })
    .option('passcode', { type: 'string' })
    .option('invitation-url', { type: 'string' });
};

export const joinCommand = (stateManager: StateManager): CommandModule => ({
  command: ['join [party-key]', 'switch [party-key]', 'use [party-key]'],
  describe: 'Join party.',
  builder: yargs => partyOptions(yargs),
  handler: asyncHandler(async (argv: Arguments<PartyJoinOptions>) => {
    const { partyKey, invitationUrl, invitation, json, passcode } = argv;

    assert(partyKey || invitation || invitationUrl, 'Invalid party.');

    let invite = null;
    if (invitation) {
      invite = JSON.parse(Buffer.from(invitation, 'base64').toString('utf8'));
    } else if (invitationUrl) {
      invite = queryString.parse(invitationUrl.split('?')[1].replace(/\\/g, ''), { decode: true });
    }

    await stateManager.joinParty(partyKey, invite, passcode);

    if (partyKey && /^[0-9a-f]{64}$/i.test(partyKey)) {
      print({ partyKey }, { json });
    }
  })
});
