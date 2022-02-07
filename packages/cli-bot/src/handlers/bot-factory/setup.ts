//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { parse, stringify } from 'envfile';
import { readFileSync } from 'fs';
import fs from 'fs-extra';
import { load } from 'js-yaml';
import path from 'path';
import readPkgUp from 'read-pkg-up';
import { Argv } from 'yargs';

import { isGlobalYarn, getGlobalModulesPath, CoreOptions } from '@dxos/cli-core';
import { Config, ConfigV1Object, mapToKeyValues } from '@dxos/config';
import { createKeyPair, keyToString } from '@dxos/crypto';

import { BOTFACTORY_ENV_FILE } from '../../config';

const envmap = readFileSync(path.join(__dirname, '../../../env-map.yml')).toString();

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

const BOT_FACTORY_DEBUG_NAMESPACES = ['dxos:bot*'];

const PREBUILDS_DIR = 'prebuilds';
const SODIUM_PREBUILDS = `sodium-native/${PREBUILDS_DIR}`;

export interface BotFactorySetupOptions extends CoreOptions {
  topic?: string
}

export const botFactorySetupOptions = (config: Config<ConfigV1Object>) => (yargs: Argv<CoreOptions>): Argv<BotFactorySetupOptions> => {
  return yargs
    .option('topic', { type: 'string', default: config.get('runtime.services.bot.topic') });
};

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

export const setup = (config: any, { includeNodePath = false } = {}) => async ({ topic } : BotFactorySetupOptions) => {
  assert(pkg, 'Unable to locate package.json');
  const cliNodePath = await getGlobalModulesPath(await isGlobalYarn(pkg.package.name));

  await setupPrebuilds(cliNodePath);

  const botFactoryEnvFile = path.join(process.cwd(), BOTFACTORY_ENV_FILE);
  await fs.ensureFile(botFactoryEnvFile);

  const envFileData = await fs.readFile(botFactoryEnvFile);

  if (!topic) {
    const { DX_BOT_TOPIC } = parse(envFileData.toString());
    topic = DX_BOT_TOPIC;
  }

  if (!topic) {
    const { publicKey } = createKeyPair();

    topic = keyToString(publicKey);
  }

  const env = {
    DEBUG: BOT_FACTORY_DEBUG_NAMESPACES.concat(
      process.env.DEBUG ? process.env.DEBUG.split(',') : []
    ).join(','),
    NODE_OPTIONS: '',
    ...mapToKeyValues(load(envmap), config.values),
    DX_BOT_TOPIC: topic,
    ...(includeNodePath ? { DX_CLI_NODE_PATH: cliNodePath } : {})
  };

  await fs.writeFile(botFactoryEnvFile, stringify(env));
};
