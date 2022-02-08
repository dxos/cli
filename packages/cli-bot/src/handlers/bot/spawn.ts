//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { print } from '@dxos/cli-core';
import type { CoreOptions } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { Config, ConfigV1Object } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface SpawnParameters {
  stateManager: StateManager,
  config: Config<ConfigV1Object>
}

export interface BotSpawnOptions extends CoreOptions {
  dxn?: string;
  ipfsCid?: string;
  localPath?: string;
}

export const botSpawnOptions = (yargs: Argv<CoreOptions>): Argv<BotSpawnOptions> => {
  return yargs
    .option('dxn', { type: 'string' })
    .option('ipfsCid', { type: 'string' })
    .option('localPath', { type: 'string' });
};

export const spawn = ({ stateManager, config } : SpawnParameters) => async ({ dxn, ipfsCid, localPath, json } : BotSpawnOptions) => {
  assert(stateManager, 'Data client is required, run \'wire extension install @dxos/cli-data\'');
  assert(!!dxn || !!ipfsCid || !!localPath, 'At least one of the following options is required: dxn, ipfsCid, localPath');
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided in config');

  const client = await stateManager.getClient();
  const party = await stateManager.getParty();

  assert(party, 'Party is required');

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const botHandle = await botFactoryClient.spawn({ dxn, ipfsCid, localPath }, party);

    print({ botId: (botHandle as any)._id }, { json });
  } finally {
    await botFactoryClient.stop();
  }
};
