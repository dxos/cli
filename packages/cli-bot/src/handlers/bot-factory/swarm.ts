//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import path from 'path';
import { Argv } from 'yargs';

import { CoreOptions, Runnable } from '@dxos/cli-core';
import { Config } from '@dxos/config';

const BF_SWARM_CONNECTOR_EXEC = 'node';
const BF_SWARM_CONNECTOR_PROCESS_NAME = 'bf-swarm-connect';
const BF_SWARM_CONNECTOR_PATH = path.join(__dirname, '../../runnable/swarm-connect.js');
const BF_SWARM_CONNECTOR_DEFAULT_LOG_FILE = '/var/log/bf-swarm-connect.log';

const swarmConnectRunable = new Runnable(BF_SWARM_CONNECTOR_EXEC, [BF_SWARM_CONNECTOR_PATH]);

export interface BotFactorySwarmOptions extends CoreOptions {
  'connect-interval': number,
  'topic': string
  detached: boolean,
  'log-file'?: string
}

export const botFactorySwarmOptions = (yargs: Argv<CoreOptions>): Argv<BotFactorySwarmOptions> => {
  return yargs
    .option('connect-interval', { type: 'number', default: 300 })
    .option('detached', { type: 'boolean', alias: 'daemon', default: false })
    .option('log-file', { type: 'string', default: BF_SWARM_CONNECTOR_DEFAULT_LOG_FILE })
    .option('topic', { type: 'string', required: true });
};

export interface SwarmOptions {
  connectInterval: number,
  topic: string,
  logFile: string,
  detached: boolean,
}

export const swarm = (config: Config) => async ({
  connectInterval,
  topic,
  logFile,
  detached
}: SwarmOptions) => {
  assert(connectInterval >= 60, 'connect-interval must be greater than or equal to 60');
  const swarmConnectorOptions = {
    name: BF_SWARM_CONNECTOR_PROCESS_NAME,
    detached,
    singleInstance: true,
    logFile,
    background: true,
    startTimeout: 10000
  };
  const { server } = config.get('runtime.services.signal')!;
  await swarmConnectRunable.run(
    [server, topic, connectInterval * 1000],
    swarmConnectorOptions
  );
};
