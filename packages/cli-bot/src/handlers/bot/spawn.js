//
// Copyright 2021 DXOS.org
//

import { BotFactoryClient } from '@dxos/botkit-client';
import { print } from '@dxos/cli-core';

export const spawn = ({ getClient, cliState }) => async ({ botName, topic, json, env, ipfsCID, ipfsEndpoint, id, name, botPath }) => {
  const { interactive } = cliState;

  const client = await getClient();

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager, topic);
  const botId = await botFactoryClient.sendSpawnRequest(botName, { env, ipfsCID, ipfsEndpoint, id, name, botPath });

  print({ botId }, { json });

  if (interactive) {
    await botFactoryClient.close();
  } else {
    // Workaround for segfaults from node-wrtc.
    process.exit(0);
  }
};
