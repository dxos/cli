#!/usr/bin/env node

const { BotFactory, BotContainer, getConfig } = require('@dxos/botkit');

const config = getConfig();
new BotFactory(config, new BotContainer(config)).start();
