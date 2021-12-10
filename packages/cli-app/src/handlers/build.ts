//
// Copyright 2020 DXOS.org
//

import { spawnSync } from 'child_process';
import semverInc from 'semver/functions/inc';

import { log } from '@dxos/debug';

import { loadAppConfig } from './config';

export interface BuildParams {
  getAppRecord: Function
}

export const build = (config: any, { getAppRecord }: BuildParams) => async ({ verbose }: any) => {
  const conf: any = await loadAppConfig();

  const record = getAppRecord(conf);
  record.version = semverInc(conf.version, 'patch'); // TODO(burdon): Pass into getAppRecord.

  log(`Building ${record.name}...`);
  const [command, ...args] = conf.build.split(' ');

  // build with configuration
  const { status } = spawnSync(command, args, {
    env: {
      ...process.env,
      CONFIG_DYNAMIC: 'true'
    },
    stdio: verbose && 'inherit'
  });

  if (status) {
    log('Build failed.');
    process.exit(status);
  }

  // TODO(burdon): Standardize OK messages for commands (only if versbose).
  log('Build Ok.');
};
