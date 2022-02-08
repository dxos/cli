//
// Copyright 2021 DXOS.org
//

import { spawnSync } from 'child_process';

import { log } from '@dxos/debug';

import { loadConfig } from '../../utils/config';

export const build = () => async ({ verbose, config: configPath }: any) => {
  const config = await loadConfig(configPath);

  verbose && log(`Building ${config.values.module?.name}...`);

  const [command, ...args] = config.values.build!.command!.split(' ');

  // Build with configuration.
  const { status } = spawnSync(command, args, {
    env: {
      ...process.env,
      CONFIG_DYNAMIC: 'true'
    },
    stdio: verbose && 'inherit'
  });

  if (status) {
    verbose && log('Build failed.');
    process.exit(status);
  }

  // TODO(burdon): Standardize OK messages for commands (only if versbose).
  verbose && log('Build Ok.');
};
