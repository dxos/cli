//
// Copyright 2021 DXOS.org
//

import { parse } from 'envfile';
import fs from 'fs-extra';
import path from 'path';

import { Runnable, sanitizeEnv } from '@dxos/cli-core';

import { BOTFACTORY_ENV_FILE, DEFAULT_LOG_FILE } from '../../config';

const BOT_FACTORY_PROCESS_NAME = 'bot-factory';

export const start = (config) => async ({ singleInstance, logFile = DEFAULT_LOG_FILE, detached, procName = BOT_FACTORY_PROCESS_NAME }) => {
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

  const bin = config.get('cli.botFactory.bin');
  const botFactoryRunnable = new Runnable(bin, []);

  await botFactoryRunnable.run([], options);
}
