//
// Copyright 2021 DXOS.org
//

import { spawn, SpawnOptions } from 'child_process';

import { log } from '@dxos/debug';

import { BOTFACTORY_PACKAGE } from '../../config';

export interface InstallOptions {
  npmClient: string,
  channel?: string,
  version?: string,
  'dry-run': boolean
}

export const install = (config: any) => async ({ 
  npmClient,
  channel,
  version,
  'dry-run': noop
}: InstallOptions) => {
  const packageVersion = `${BOTFACTORY_PACKAGE}@${(version || channel) ?? 'latest'}`;
  const args = npmClient === 'npm' ? ['install', '-g'] : ['global', 'add'];
  args.push(packageVersion);
  const options: SpawnOptions = {
    stdio: 'inherit',
    env: { ...process.env }
  };
  log(`Installing ${packageVersion}...`);
  log(`${[npmClient, ...args].join(' ')}`);

  if (!noop) {
    spawn(npmClient, args, options);
  }
};
