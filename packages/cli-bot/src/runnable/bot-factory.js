#!/usr/bin/env node

const { NODE_ENV, NATIVE_ENV, BotFactory, NodeBotContainer, NativeBotContainer, getConfig } = require('@dxos/botkit');

const config = getConfig();

new BotFactory(config, {
  [NODE_ENV]: new NodeBotContainer(config),
  [NATIVE_ENV]: new NativeBotContainer(config)
}).start();
