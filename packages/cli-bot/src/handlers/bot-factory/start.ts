//
// Copyright 2021 DXOS.org
//

import { parse } from 'envfile';
import fs from 'fs-extra';
import path from 'path';
import { Argv } from 'yargs';

import { CoreOptions, Runnable, sanitizeEnv } from '@dxos/cli-core';

import { BOTFACTORY_ENV_FILE } from '../../config';

const BOT_FACTORY_PROCESS_NAME = 'bot-factory';

export interface BotFactoryStartOptions extends CoreOptions {
  'single-instance': boolean,
  detached: boolean,
  'log-file'?: string,
  'proc-name'?: string
}

export const botFactoryStartOptions = (yargs: Argv<CoreOptions>): Argv<BotFactoryStartOptions> => {
  return yargs
    .option('single-instance', { type: 'boolean', default: false })
    .option('detached', { type: 'boolean', alias: 'daemon', default: false })
    .option('log-file', { type: 'string' })
    .option('proc-name', { type: 'string' });
};

export interface StartOptions {
  singleInstance: string,
  logFile: string,
  detached: boolean,
  procName?: string
}

export const start = () => async ({
  singleInstance,
  logFile,
  detached,
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
  const botFactoryRunnable = new Runnable(bin, []);

  await botFactoryRunnable.run([], options);
};
