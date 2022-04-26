//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import type { CoreOptions } from '@dxos/cli-core';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

import { createNetworkManager } from '../../helpers';

export interface StopParameters {
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

export const botStop = ({ config } : StopParameters) => async ({ botId } : BotStopOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const networkManager = createNetworkManager(config);
  const botFactoryClient = new BotFactoryClient(networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const handle = await botFactoryClient.getBot(botId);
    await handle.stop();
  } finally {
    await botFactoryClient.stop();
    await networkManager.destroy();
  }
};
