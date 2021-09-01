//
// Copyright 2021 DXOS.org
//

import { parse, stringify } from 'envfile';
import { load } from 'js-yaml';
import fs from 'fs-extra';
import path from 'path';
import readPkgUp from 'read-pkg-up';

import { isGlobalYarn, getGlobalModulesPath } from '@dxos/cli-core';
import { createKeyPair, keyToString } from '@dxos/crypto';
import { mapToKeyValues } from '@dxos/config';

import { BOTFACTORY_ENV_FILE } from '../../config';
import envmap from '../../../env-map.yml';

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

const BOT_FACTORY_DEBUG_NAMESPACES = ['bot-factory', 'bot-factory:*'];

export const setup = (config) => async ({ topic, secretKey, localDev, reset }) => {

  const botFactoryEnvFile = path.join(process.cwd(), BOTFACTORY_ENV_FILE);
  await fs.ensureFile(botFactoryEnvFile);

  const envFileData = await fs.readFile(botFactoryEnvFile);

  let { DX_BOT_TOPIC = topic, DX_BOT_SECRET_KEY = secretKey } = parse(envFileData.toString());

  if (!DX_BOT_TOPIC || !DX_BOT_SECRET_KEY) {
    const { publicKey, secretKey } = createKeyPair();

    DX_BOT_TOPIC = keyToString(publicKey);
    DX_BOT_SECRET_KEY = keyToString(secretKey);
  }

  const env = {
    DEBUG: BOT_FACTORY_DEBUG_NAMESPACES.concat(
      process.env.DEBUG ? process.env.DEBUG.split(',') : []
    ).join(','),
    NODE_OPTIONS: '',
    ...mapToKeyValues(load(envmap), config.values),
    DX_BOT_RESET: reset,
    DX_BOT_TOPIC,
    DX_BOT_SECRET_KEY,
    DX_BOT_LOCAL_DEV: localDev,
    DX_CLI_NODE_PATH: await getGlobalModulesPath(await isGlobalYarn(pkg.package.name)),
    DEBUG_HIDE_DATE: true
  };

  await fs.writeFile(botFactoryEnvFile, stringify(env));
};
