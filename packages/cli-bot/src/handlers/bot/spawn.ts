//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { print } from '@dxos/cli-core';
import type { CoreOptions } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-party';
import type { Config } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

import { createNetworkManager } from '../../helpers';

export interface SpawnParameters {
  stateManager: StateManager,
  config: Config
}

export interface BotSpawnOptions extends CoreOptions {
  name?: string;
  ipfsCid?: string;
  localPath?: string;
}

export const botSpawnOptions = (yargs: Argv<CoreOptions>): Argv<BotSpawnOptions> => {
  return yargs
    .option('name', { type: 'string' })
    .option('ipfsCid', { type: 'string' })
    .option('localPath', { type: 'string' });
};

export const spawn = ({ stateManager, config } : SpawnParameters) => async ({ name, ipfsCid, localPath, json } : BotSpawnOptions) => {
  assert(stateManager, 'Data client is required, run \'dx extension install @dxos/cli-party\'');
  assert(!!name || !!ipfsCid || !!localPath, 'At least one of the following options is required: name, ipfsCid, localPath');
  const topic = config.get('runtime.services.bot.topic');
  assert(topic, 'Topic must be provided in config');

  const party = await stateManager.getParty();

  assert(party, 'Party is required');

  const networkManager = createNetworkManager(config);
  const botFactoryClient = new BotFactoryClient(networkManager);
  try {
    await botFactoryClient.start(PublicKey.from(topic));
    const botHandle = await botFactoryClient.spawn({ name, ipfsCid, localPath }, party);

    print({ botId: (botHandle as any)._id }, { json });
  } finally {
    await botFactoryClient.stop();
    await networkManager.destroy();
  }
};
