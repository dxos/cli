//
// Copyright 2021 DXOS.org
//

import { spawnSync } from 'child_process';

import { log } from '@dxos/debug';

import { PackageModule } from '../../utils/config';

export const build = (module: PackageModule) => async ({ verbose }: any) => {
  verbose && log(`Building module ${module.name}...`);

  const [command, ...args] = module.build!.command!.split(' ');

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
