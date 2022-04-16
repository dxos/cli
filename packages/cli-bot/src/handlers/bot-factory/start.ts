//
// Copyright 2021 DXOS.org
//

import { parse } from 'envfile';
import fs from 'fs-extra';
import path from 'path';
import { Argv } from 'yargs';

import { CoreOptions, Runnable, sanitizeEnv } from '@dxos/cli-core';

import { BOTFACTORY_ENV_FILE, BOT_FACTORY_PERSISTENT, BOT_RETRY_ATTEMPTS } from '../../config';

export const BOT_FACTORY_PROCESS_NAME = 'bot-factory';

export interface BotFactoryStartOptions extends CoreOptions {
  'single-instance': boolean,
  detached: boolean,
  'log-file'?: string,
  'proc-name'?: string,
  dev: boolean,
  withNodePath?: boolean
  persistent?: boolean
  retryAttempts?: number
}

export const botFactoryStartOptions = (yargs: Argv<CoreOptions>): Argv<BotFactoryStartOptions> => {
  return yargs
    .option('single-instance', { type: 'boolean', default: false })
    .option('detached', { type: 'boolean', alias: 'daemon', default: false })
    .option('log-file', { type: 'string' })
    .option('proc-name', { type: 'string' })
    .option('dev', { type: 'boolean', default: false })
    .option('with-node-path', { type: 'boolean', default: false })
    .option('persistent', { type: 'boolean', default: BOT_FACTORY_PERSISTENT })
    .option('retry-attempts', { type: 'number', default: BOT_RETRY_ATTEMPTS });
};

export interface StartOptions {
  singleInstance: string,
  logFile: string,
  detached: boolean,
  dev: boolean
  procName?: string
}

export const start = () => async ({
  singleInstance,
  logFile,
  detached,
  dev,
  procName = BOT_FACTORY_PROCESS_NAME
}: StartOptions) => {
  const botFactoryEnvFile = path.join(process.cwd(), BOTFACTORY_ENV_FILE);
  const envFileData = await fs.readFile(botFactoryEnvFile);

  const env = parse(envFileData.toString());

  const options = {
    name: procName,
    env: {
      ...sanitizeEnv(process.env),
      ...env
    },
    detached,
    singleInstance,
    logFile
  };

  const bin = 'bot-factory';
  const binArgs = dev ? ['ts-node/register/transpile-only'] : [];
  const botFactoryRunnable = new Runnable(bin, binArgs);

  await botFactoryRunnable.run([], options);
};
