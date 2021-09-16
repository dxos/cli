//
// Copyright 2020 DXOS.org
//
import assert from 'assert';
import path from 'path';
import queryString from 'query-string';
import { Arguments, Argv, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export interface PartyInviteOptions extends PartyOptions {
  appUrl?: string
}

const options = (yargs: Argv<PartyOptions>): Argv<PartyInviteOptions> => {
  return yargs
    .option('app-url', { type: 'string' });
};

export const inviteCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyInviteOptions> => ({
  command: ['invite'],
  describe: 'Invite another participant.',
  builder: yargs => options(yargs),
  handler: asyncHandler(async (argv: Arguments<PartyInviteOptions>) => {
    const { appUrl, json } = argv;

    const party = await stateManager.getParty();
    assert(party, 'Invalid party.');

    const result: any = { partyKey: party.key.toHex() };
    const { invitation: invite, passcode } = await stateManager.createSecretInvitation(party.key.toHex());

    if (appUrl) {
      result.invitationUrl = path.join(
        appUrl.split('#')[0],
        `#/auth?${queryString.stringify(invite)}`
      );
    } else {
      result.invitation = Buffer.from(JSON.stringify(invite)).toString('base64');
    }

    return print({ ...result, passcode }, { json });
  })
});
