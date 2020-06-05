//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';
import path from 'path';
import queryString from 'query-string';

import { keyToString } from '@dxos/crypto';
import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const PartyModule = ({ stateManager }) => ({
  command: ['party'],
  describe: 'Party CLI.',
  builder: yargs => yargs
    .option('party-key')

    // Join party.
    .command({
      command: ['$0 [party-key]', 'join [party-key]', 'switch [party-key]'],
      describe: 'Join party.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('invitation')
        .option('url'),

      handler: asyncHandler(async argv => {
        const { partyKey, url, invitation } = argv;

        assert(partyKey, 'Invalid party key.');

        let invite = null;
        if (invitation) {
          invite = JSON.parse(Buffer.from(invitation, 'base64').toString('utf8'));
        } else if (url) {
          invite = queryString.parse(url.split('?')[1].replace(/\\/g, ''), { decode: true });
        }

        await stateManager.joinParty(partyKey, invite);

        if (/^[0-9a-f]{64}$/i.test(partyKey)) {
          log(JSON.stringify({ partyKey }, null, 2));
        }
      })
    })

    // Current party.
    .command({
      command: ['current'],
      describe: 'Current party.',
      builder: yargs => yargs,

      handler: asyncHandler(async () => {
        log(JSON.stringify({ currentParty: stateManager.currentParty }, null, 2));
      })
    })

    // Create party.
    .command({
      command: ['create'],
      describe: 'Create party.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('secured', { alias: 's', type: 'boolean', default: true }),

      handler: asyncHandler(async () => {
        const party = await stateManager.createParty();
        log(JSON.stringify({ partyKey: keyToString(party.publicKey) }, null, 2));
      })
    })

    // Invite another participant.
    .command({
      command: ['invite'],
      describe: 'Invite another participant.',
      builder: yargs => yargs
        .option('app-url'),

      handler: asyncHandler(async argv => {
        const { appUrl } = argv;

        const party = stateManager.currentParty;
        assert(party, 'Invalid party.');

        let result = { partyKey: party };
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
      })
    })
});
