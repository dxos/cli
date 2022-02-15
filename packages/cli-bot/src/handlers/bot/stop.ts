//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import type { CoreOptions } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface StopParameters {
  stateManager: StateManager,
  config: Config
}

export interface BotStopOptions extends CoreOptions {
  botId: string;
}

export const botStopOptions = (yargs: Argv<CoreOptions>): Argv<BotStopOptions> => {
  return yargs
    .positional('botId', { type: 'string' })
    .demandOption('botId');
};

export const botStop = ({ stateManager, config } : StopParameters) => async ({ botId } : BotStopOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const client = await stateManager.getClient();

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const handle = await botFactoryClient.get(botId);
    await handle.stop();
  } finally {
    await botFactoryClient.stop();
  }
};
