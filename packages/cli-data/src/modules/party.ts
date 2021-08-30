//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';
import path from 'path';
import queryString from 'query-string';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { StateManager } from '../state-manager';

interface Params {
  stateManager: StateManager
}

export const PartyModule = ({ stateManager }: Params) => ({
  command: ['party'],
  describe: 'Party CLI.',
  builder: (yargs: Argv) => yargs
    .option('party-key', {})

    // Join party.
    .command({
      command: ['join [party-key]', 'switch [party-key]', 'use [party-key]'],
      describe: 'Join party.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('invitation', {})
        .option('invitation-url', {}),

      handler: asyncHandler(async (argv: any) => {
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
      })
    })

    // Current party.
    .command({
      command: ['info'],
      describe: 'Current party info.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        print({ party: stateManager.currentParty }, { json });
      })
    })

    // Open party.
    .command({
      command: ['open'],
      describe: 'Current party.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true }),

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        const party = await stateManager.getParty();
        if (!party) {
          throw new Error('You don\'t have any available parties yet, create new one or use invitation to join existing party.');
        }
        await party.open();

        print({ party: party.key.toHex() }, { json });
      })
    })

    // List parties.
    .command({
      command: ['list'],
      describe: 'List parties.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        const parties = Array.from(stateManager.parties.values()).map(({ partyKey, ...rest }) => ({
          party: partyKey,
          ...rest,
          current: partyKey === stateManager.currentParty
        }));

        print(parties, { json });
      })
    })

    // Create party.
    .command({
      command: ['create'],
      describe: 'Create party.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('secured', { alias: 's', type: 'boolean', default: true }),

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        const party = await stateManager.createParty();
        print({ party: party.key.toHex() }, { json });
      })
    })

    .command({
      command: ['members'],
      describe: 'List party members.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        const members = stateManager.party?.queryMembers().value ?? [];

        print(Array.from(members).filter(Boolean), { json });
      })
    })

    // Invite another participant.
    .command({
      command: ['invite'],
      describe: 'Invite another participant.',
      builder: yargs => yargs
        .option('app-url', {}),

      handler: asyncHandler(async (argv: any) => {
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
      })
    })
});
