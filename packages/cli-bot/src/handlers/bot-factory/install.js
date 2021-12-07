//
// Copyright 2021 DXOS.org
//

import { spawn } from 'child_process';

import { log } from '@dxos/debug';

export const install = (config) => async ({ npmClient, channel, version, 'dry-run': noop }) => {
  const npmPkg = config.get('runtime.cli.botFactory.package');
  const packageVersion = `${npmPkg}@${version || channel}`;
  const args = npmClient === 'npm' ? ['install', '-g'] : ['global', 'add'];
  args.push(packageVersion);
  const options = {
    stdio: 'inherit',
    env: { ...process.env }
  };
  log(`Installing ${packageVersion}...`);
  log(`${[npmClient, ...args].join(' ')}`);

  if (!noop) {
    spawn(npmClient, args, options);
  }
};
