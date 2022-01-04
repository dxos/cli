//
// Copyright 2021 DXOS.org
//

import { parse } from 'envfile';
import fs from 'fs-extra';
import path from 'path';

import { Runnable, sanitizeEnv } from '@dxos/cli-core';

import { BOTFACTORY_ENV_FILE } from '../../config';

const BOT_FACTORY_PROCESS_NAME = 'bot-factory';

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
