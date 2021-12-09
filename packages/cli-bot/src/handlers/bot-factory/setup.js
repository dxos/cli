//
// Copyright 2021 DXOS.org
//

import { parse, stringify } from 'envfile';
import { readFileSync } from 'fs';
import fs from 'fs-extra';
import { load } from 'js-yaml';
import path from 'path';
import readPkgUp from 'read-pkg-up';

import { isGlobalYarn, getGlobalModulesPath } from '@dxos/cli-core';
import { mapToKeyValues } from '@dxos/config';
import { createKeyPair, keyToString } from '@dxos/crypto';

import { BOTFACTORY_ENV_FILE } from '../../config';

const envmap = readFileSync(path.join(__dirname, '../../../env-map.yml')).toString();

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

const BOT_FACTORY_DEBUG_NAMESPACES = ['bot-factory', 'bot-factory:*'];

const PREBUILDS_DIR = 'prebuilds';
const SODIUM_PREBUILDS = `sodium-native/${PREBUILDS_DIR}`;

/**
 * Sets up proper location for sodium-native prebuilds so bots would be able to reuse it.
 */
const setupPrebuilds = async (cliNodePath) => {
  const prebuildsPath = path.join(cliNodePath, SODIUM_PREBUILDS);
  const prebuildsBotsPath = path.join(path.dirname(process.execPath), PREBUILDS_DIR);

  if (!fs.existsSync(prebuildsPath)) {
    throw new Error('Unable to locate sodium-native prebuilds. Please make sure proper \'cli.npmClient\' is configured in your CLI profile.');
  }

  await fs.copy(prebuildsPath, prebuildsBotsPath);
};

export const setup = (config, { includeNodePath = false } = {}) => async ({ topic, secretKey /*, localDev, reset */ }) => {
  const cliNodePath = await getGlobalModulesPath(await isGlobalYarn(pkg.package.name));

  await setupPrebuilds(cliNodePath);

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
    DX_BOT_TOPIC,
    // DX_BOT_SECRET_KEY,
    // DX_BOT_LOCAL_DEV: localDev,
    // DEBUG_HIDE_DATE: true,
    ...(includeNodePath ? { DX_CLI_NODE_PATH: cliNodePath } : {})
  };

  await fs.writeFile(botFactoryEnvFile, stringify(env));
};
