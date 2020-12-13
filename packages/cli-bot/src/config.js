//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import pick from 'lodash.pick';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'node-yaml';

import { BOT_CONFIG_FILENAME } from '@dxos/botkit';
import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile, writeFile } from '@dxos/cli-core';
import { createKeyPair, keyToString } from '@dxos/crypto';

export const SERVICE_CONFIG_FILENAME = 'service.yml';

/**
 * @returns {Object}
 */
export const getBotFactoryServiceConfig = async () => {
  const serviceConfigFile = path.join(process.cwd(), SERVICE_CONFIG_FILENAME);
  await fs.ensureFile(serviceConfigFile);
  const serviceConfig = await yaml.read(serviceConfigFile) || {};

  if (!serviceConfig.topic || !serviceConfig.secretKey) {
    const { publicKey, secretKey } = createKeyPair();
    serviceConfig.topic = keyToString(publicKey);
    serviceConfig.secretKey = keyToString(secretKey);
  }

  await yaml.write(serviceConfigFile, serviceConfig);

  return serviceConfig;
};

export const getBotConfig = async () => {
  const packageProperties = pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME) : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES);

  const botConfig = fs.existsSync(BOT_CONFIG_FILENAME) ? await readFile(BOT_CONFIG_FILENAME) : {};

  return {
    ...packageProperties,
    ...botConfig
  };
};

export const updateBotConfig = async config => {
  let botConfig = fs.existsSync(BOT_CONFIG_FILENAME) ? await readFile(BOT_CONFIG_FILENAME) : {};
  botConfig = defaultsDeep({}, config, botConfig);

  await writeFile(botConfig, BOT_CONFIG_FILENAME);
};
