//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { BotFactoryClient } from '@dxos/botkit-client';
import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const invite = ({ getClient, stateManager }) => async ({ topic, botId, spec, botName, json, env, ipfsCID, ipfsEndpoint, id, name, botPath }) => {
  assert(topic, 'Invalid topic.');

  const botSpec = spec ? JSON.parse(spec) : {};

  const party = stateManager.currentParty;
  assert(party, 'Invalid party.');

  const client = await getClient();
  const botFactoryClient = new BotFactoryClient(client.echo.networkManager, topic);

  let invitation;
  if (!stateManager.isOpenParty(party)) {
    invitation = await stateManager.createSignatureInvitation(party, topic);
  }
  const invitationObject = invitation.toQueryParameters();

  log(`Inviting bot ${botId || botName || ''} to join '${party}' party with invitation: ${JSON.stringify(invitationObject)}.`);
  if (botId) {
    await botFactoryClient.sendInvitationRequest(botId, party, botSpec, invitationObject);
  } else {
    const botId = await botFactoryClient.sendSpawnAndInviteRequest(botName, party, invitationObject, { env, ipfsCID, ipfsEndpoint, id, name, botPath });

    print({ botId }, { json });
  }

  await botFactoryClient.close();
};
