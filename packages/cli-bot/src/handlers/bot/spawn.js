//
// Copyright 2021 DXOS.org
//

import { BotFactoryClient } from '@dxos/botkit-client';

export const spawn = ({ getClient, cliState }) => async ({ botName, topic, json, env, ipfsCID, ipfsEndpoint, id, name }) => {
  const { interactive } = cliState;

  const client = await getClient();
  const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
  const botId = await botFactoryClient.sendSpawnRequest(botName, { env, ipfsCID, ipfsEndpoint, id, name });

  print({ botId }, { json });

  if (interactive) {
    await botFactoryClient.close();
  } else {
    // Workaround for segfaults from node-wrtc.
    process.exit(0);
  }
};
