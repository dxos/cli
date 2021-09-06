//
// Copyright 2020 DXOS.org
//
import assert from 'assert';
import path from 'path';
import queryString from 'query-string';
import { Argv, CommandModule, Arguments } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export interface PartyInviteOptions extends PartyOptions {
  appUrl?: string
}

const partyOptions = (yargs: Argv<PartyOptions>): Argv<PartyInviteOptions> => {
  return yargs
    .option('app-url', { type: 'string' });
};

export const inviteCommand = (stateManager: StateManager): CommandModule => ({
  command: ['invite'],
  describe: 'Invite another participant.',
  builder: yargs => partyOptions(yargs),
  handler: asyncHandler(async (argv: Arguments<PartyInviteOptions>) => {
    const { appUrl } = argv;

    const party = stateManager.currentParty;
    assert(party, 'Invalid party.');

    let result: any = { partyKey: party };
    if (!stateManager.isOpenParty(party)) {
      const { invitation: invite, passcode } = await stateManager.createSecretInvitation(party);

      if (appUrl) {
        result.invitationUrl = path.join(
          appUrl.split('#')[0],
          `#/auth?${queryString.stringify(invite)}`
        );
      } else {
        result.invitation = Buffer.from(JSON.stringify(invite)).toString('base64');
      }

      result = { ...result, passcode };
    }
    log(JSON.stringify(result, null, 2));
    return result;
  })
});
