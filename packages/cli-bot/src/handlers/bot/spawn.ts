//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { print } from '@dxos/cli-core';
import type { CoreOptions, CoreState } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import { Argv } from 'yargs';
import type { Config, ConfigV1Object } from '@dxos/config';
import { PublicKey } from '@dxos/crypto';

export interface SpawnParameters {
  stateManager: StateManager,
  cliState: CoreState['cliState'],
  config: Config<ConfigV1Object>
}

export interface BotSpawnOptions extends CoreOptions {
  dxn?: string;
  ipfsCid?: string;
  localPath?: string;
}

export const botSpawnOptions = (yargs: Argv<CoreOptions>): Argv<BotSpawnOptions> => {
  return yargs.
    option('dxn', { type: 'string' }).
    option('ipfsCid', { type: 'string' }).
    option('localPath', { type: 'string' });
};

export const spawn = ({ stateManager, cliState } : SpawnParameters) => async ({ dxn, ipfsCid, localPath, json } : BotSpawnOptions) => {
  assert(stateManager, 'Data client is required, run \'wire extension install @dxos/cli-data\'');
  assert(!!dxn || !!ipfsCid || !!localPath, 'At least one of the following options is required: dxn, ipfsCid, localPath');

  const { interactive } = cliState;
  const topic = 'd5943248a8b8390bc0c08d9fc5fc447a3fff88abb0474c9fd647672fc8b03edb';
  assert(topic, 'Topic must be specified in config');

  const client = await stateManager.getClient();
  const party = await stateManager.getParty();

  assert(party, 'Party is required');

  const botFactoryClient = new BotFactoryClient(client.echo.networkManager);
  botFactoryClient.start(PublicKey.from(topic))
  const botHandle = await botFactoryClient.spawn({ dxn, ipfsCid, localPath }, client, party);

  print({ botId: (botHandle as any)._id }, { json });

  if (interactive) {
    await botFactoryClient.stop();
  } else {
    // Workaround for segfaults from node-wrtc.
    process.exit(0);
  }
};
