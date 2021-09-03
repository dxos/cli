//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import queryString from 'query-string';
import { CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const joinCommand = (stateManager: StateManager): CommandModule => ({
  command: ['join [party-key]', 'switch [party-key]', 'use [party-key]'],
  describe: 'Join party.',
  builder: yargs => yargs
    .option('interactive', { hidden: true, default: true })
    .option('invitation', {})
    .option('invitation-url', {}),

  handler: async (argv: any) => {
    const { partyKey, invitationUrl, invitation, json } = argv;

    assert(partyKey || invitation || invitationUrl, 'Invalid party.');

    let invite = null;
    if (invitation) {
      invite = JSON.parse(Buffer.from(invitation, 'base64').toString('utf8'));
    } else if (invitationUrl) {
      invite = queryString.parse(invitationUrl.split('?')[1].replace(/\\/g, ''), { decode: true });
    }

    await stateManager.joinParty(partyKey, invite);

    if (/^[0-9a-f]{64}$/i.test(partyKey)) {
      print({ partyKey }, { json });
    }
  }
});
