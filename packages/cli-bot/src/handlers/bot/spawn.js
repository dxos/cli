//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { BotFactoryClient } from '@dxos/botkit-client';
import { print } from '@dxos/cli-core';

export const spawn = ({ stateManager, cliState }) => async ({ botName, topic, json, env, ipfsCID, ipfsEndpoint, id, name, botPath }) => {
  assert(stateManager, 'Data client is required, run \'wire extension install @dxos/cli-data\'');

  const { interactive } = cliState;

  const client = await stateManager.getClient();

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
