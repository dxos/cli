//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import pick from 'lodash.pick';
import fs from 'fs-extra';

import { BOT_CONFIG_FILENAME } from '@dxos/botkit';
import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile, writeFile } from '@dxos/cli-core';

export const BOTFACTORY_ENV_FILE = 'bot-factory.env';

export const DEFAULT_LOG_FILE = '/var/log/bot-factory.log';

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
