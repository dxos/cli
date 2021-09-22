#!/usr/bin/env node

//
// Copyright 2021 DXOS.org
//

import { NODE_ENV, NATIVE_ENV, BotFactory, NodeBotContainer, NativeBotContainer, getConfig } from '@dxos/botkit';

const config = getConfig();

void new BotFactory(config, {
  [NODE_ENV]: new NodeBotContainer(config),
  [NATIVE_ENV]: new NativeBotContainer(config)
}).start();
