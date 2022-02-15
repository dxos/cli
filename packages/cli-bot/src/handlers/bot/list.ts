//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { print } from '@dxos/cli-core';
import type { CoreOptions } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface ListParameters {
  stateManager: StateManager,
  config: Config
}

export type BotListOptions = CoreOptions

export const botListOptions = (yargs: Argv<CoreOptions>): Argv<BotListOptions> => {
  return yargs;
};

export const list = ({ stateManager, config } : ListParameters) => async ({ json } : BotListOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const client = await stateManager.getClient();

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const bots = await botFactoryClient.list();

    print(bots.map(bot => ({ id: bot.id, status: bot.status === 1 ? 'RUNNING' : 'STOPPED' })), { json });
  } finally {
    await botFactoryClient.stop();
  }
};
