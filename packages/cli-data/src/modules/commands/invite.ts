//
// Copyright 2020 DXOS.org
//
import assert from 'assert';
import path from 'path';
import queryString from 'query-string';
import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { StateManager } from '../../state-manager';

export const inviteCommand = (stateManager: StateManager): CommandModule => ({
  command: ['invite'],
  describe: 'Invite another participant.',
  builder: yargs => yargs
    .option('app-url', {}),

  handler: async (argv: any) => {
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
  }
});
