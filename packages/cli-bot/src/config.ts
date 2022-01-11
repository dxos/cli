//
// Copyright 2020 DXOS.org
//

import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';

import { readFile, writeFile } from '@dxos/cli-core';

export const BOTFACTORY_ENV_FILE = 'bot-factory.env';
export const BOTFACTORY_PACKAGE = '@dxos/botkit';
export const BOT_CONFIG_FILENAME = 'bot.yml';

 export const getBotConfig = async () => {
    const botConfig = fs.existsSync(BOT_CONFIG_FILENAME) ? await readFile(BOT_CONFIG_FILENAME) : {};
  
    return botConfig;
  };
  
  export const updateBotConfig = async (config: any) => {
    let botConfig = fs.existsSync(BOT_CONFIG_FILENAME) ? await readFile(BOT_CONFIG_FILENAME) : {};
    botConfig = defaultsDeep({}, config, botConfig);
  
    await writeFile(botConfig, BOT_CONFIG_FILENAME);
  };
