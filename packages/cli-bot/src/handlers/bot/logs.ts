//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { CoreOptions, print } from '@dxos/cli-core';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

import { createNetworkManager } from '../../helpers';

export interface LogsParameters {
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

export const botLogs = ({ config } : LogsParameters) => async ({ botId } : BotLogsOptions) => {
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided required');

  const networkManager = createNetworkManager(config);
  const botFactoryClient = new BotFactoryClient(networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const handle = await botFactoryClient.getBot(botId);
    const stream = handle.logsStream();
    await new Promise<void>(resolve => {
      stream.subscribe((msg: any) => {
        print(msg.chunk?.toString());
      }, () => resolve());
    });
  } finally {
    await botFactoryClient.stop();
    await networkManager.destroy();
  }
};
