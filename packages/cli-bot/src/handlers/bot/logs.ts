//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { CoreOptions, print } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface LogsParameters {
  stateManager: StateManager,
  config: Config
}

export interface BotLogsOptions extends CoreOptions {
  botId: string;
}

export const botLogsOptions = (yargs: Argv<CoreOptions>): Argv<BotLogsOptions> => {
  return yargs
    .positional('botId', { type: 'string' })
    .demandOption('botId');
};

export const botLogs = ({ stateManager, config } : LogsParameters) => async ({ botId } : BotLogsOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const client = await stateManager.getClient();

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const handle = await botFactoryClient.get(botId);
    const stream = handle.logsStream();
    await new Promise<void>(resolve => {
      stream.subscribe(msg => {
        print(msg.chunk?.toString());
      }, () => resolve());
    });
  } finally {
    await botFactoryClient.stop();
  }
};
