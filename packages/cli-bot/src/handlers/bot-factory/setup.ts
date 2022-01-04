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
import assert from 'assert';

const envmap = readFileSync(path.join(__dirname, '../../../env-map.yml')).toString();

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

const BOT_FACTORY_DEBUG_NAMESPACES = ['dxos:bot*'];

const PREBUILDS_DIR = 'prebuilds';
const SODIUM_PREBUILDS = `sodium-native/${PREBUILDS_DIR}`;

export interface SetupOptions {
  topic: string
}

/**
 * Sets up proper location for sodium-native prebuilds so bots would be able to reuse it.
 */
const setupPrebuilds = async (cliNodePath: string) => {
  const prebuildsPath = path.join(cliNodePath, SODIUM_PREBUILDS);
  const prebuildsBotsPath = path.join(path.dirname(process.execPath), PREBUILDS_DIR);

  if (!fs.existsSync(prebuildsPath)) {
    throw new Error('Unable to locate sodium-native prebuilds. Please make sure proper \'cli.npmClient\' is configured in your CLI profile.');
  }

  await fs.copy(prebuildsPath, prebuildsBotsPath);
};

export const setup = (config: any, { includeNodePath = false } = {}) => async ({ topic } : SetupOptions) => {
  assert(pkg, 'Unable to locate package.json');
  const cliNodePath = await getGlobalModulesPath(await isGlobalYarn(pkg.package.name));

  await setupPrebuilds(cliNodePath);

  const botFactoryEnvFile = path.join(process.cwd(), BOTFACTORY_ENV_FILE);
  console.log('botFactoryEnvFile', botFactoryEnvFile)
  await fs.ensureFile(botFactoryEnvFile);

  const envFileData = await fs.readFile(botFactoryEnvFile);

  let { DX_BOT_TOPIC = topic } = parse(envFileData.toString());

  if (!DX_BOT_TOPIC) {
    const { publicKey } = createKeyPair();

    DX_BOT_TOPIC = keyToString(publicKey);
  }

  const env = {
    DEBUG: BOT_FACTORY_DEBUG_NAMESPACES.concat(
      process.env.DEBUG ? process.env.DEBUG.split(',') : []
    ).join(','),
    NODE_OPTIONS: '',
    ...mapToKeyValues(load(envmap), config.values),
    DX_BOT_TOPIC,
    ...(includeNodePath ? { DX_CLI_NODE_PATH: cliNodePath } : {})
  };

  await fs.writeFile(botFactoryEnvFile, stringify(env));
};
