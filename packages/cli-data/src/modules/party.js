//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import path from 'path';
import queryString from 'query-string';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { humanize } from '@dxos/crypto';

export const PartyModule = ({ stateManager, getClient }) => ({
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
        .option('invitation-url'),

      handler: asyncHandler(async argv => {
        const { partyKey, invitationUrl, invitation } = argv;

        assert(partyKey || invitation || invitationUrl, 'Invalid party.');

        let invite = null;
        if (invitation) {
          invite = JSON.parse(Buffer.from(invitation, 'base64').toString('utf8'));
        } else if (invitationUrl) {
          invite = queryString.parse(invitationUrl.split('?')[1].replace(/\\/g, ''), { decode: true });
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
        log(JSON.stringify({ partyKey: party.key.toHex() }, null, 2));
      })
    })

    .command({
      command: ['members'],
      describe: 'List party members.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv) => {
        const { json } = argv;

        const client = await getClient();
        const keyring = client.echo.keyring;
        const partyKeys = new Map();

        stateManager.party.queryMembers().value.forEach(member => partyKeys.set(member.publicKey.toHex(), keyring.getKey(member.publicKey)));

        print(Array.from(partyKeys.values()).filter(Boolean), { json });
      })
    })

    .command({
      command: ['items'],
      describe: 'List party items.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv) => {
        const { json } = argv;

        const items = stateManager.party.database.queryItems().value;
        const result = (items || []).map(item => {
          const modelName = Object.getPrototypeOf(item.model).constructor.name;
          return {
            id: humanize(item.id),
            type: item.type,
            modelType: item.model._meta.type,
            modelName
          };
        });
        print(result, { json });
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
