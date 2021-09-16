//
// Copyright 2021 DXOS.org
//

import path from 'path';

import { BUILD_PATH, buildBot } from '@dxos/botkit';

export const build = () => async () => {
  const botPath = path.join(process.cwd(), '/src/main.js');
  const buildPath = path.join(process.cwd(), BUILD_PATH, 'node', 'main.js');

  await buildBot(botPath, false, buildPath);
};
