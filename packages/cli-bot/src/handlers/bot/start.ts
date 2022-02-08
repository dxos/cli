//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import type { CoreOptions } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { Config, ConfigV1Object } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface StartPatameters {
  stateManager: StateManager,
  config: Config<ConfigV1Object>
}

export interface BotStartOptions extends CoreOptions {
  botId: string;
}

export const botStartOptions = (yargs: Argv<CoreOptions>): Argv<BotStartOptions> => {
  return yargs
    .positional('botId', { type: 'string' })
    .demandOption('botId');
};

export const botStart = ({ stateManager, config } : StartPatameters) => async ({ botId } : BotStartOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const client = await stateManager.getClient();

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    await botFactoryClient.start(PublicKey.from(botId));
  } catch (error: unknown) {
    throw error;
  } finally {
    await botFactoryClient.stop();
  }
};
