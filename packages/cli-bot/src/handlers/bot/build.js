//
// Copyright 2020 DXOS.org
//

import { spawnSync } from 'child_process';
import get from 'lodash.get';

import { BOT_CONFIG_FILENAME } from '@dxos/botkit';
import { readFile } from '@dxos/cli-core';
import { log } from '@dxos/debug';

const DEFAULT_BUILD = 'yarn build';

export const build = () => async ({ verbose, target }) => {
  const botConfig = await readFile(BOT_CONFIG_FILENAME);
  const build = target ? get(botConfig, `build.${target}`, DEFAULT_BUILD) : DEFAULT_BUILD;

  log(`Building for ${target}...`);

  const [command, ...args] = build.split(' ');

  const { status } = spawnSync(command, args, {
    env: {
      ...process.env
    },
    stdio: verbose && 'inherit'
  });

  if (status) {
    log('Build failed.');
    process.exit(status);
  }

  log('Build Ok.');
};
