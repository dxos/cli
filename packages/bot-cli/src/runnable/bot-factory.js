#!/usr/bin/env node

const { BotFactory, getConfig } = require('@dxos/botkit');

new BotFactory(getConfig()).start();
