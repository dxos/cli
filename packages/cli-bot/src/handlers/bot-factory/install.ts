//
// Copyright 2021 DXOS.org
//

import { spawn, SpawnOptions } from 'child_process';
import { Argv } from 'yargs';

import { log } from '@dxos/debug';
import { CoreOptions } from '@dxos/cli-core';
import { Config, ConfigV1Object } from '@dxos/config';

import { BOTFACTORY_PACKAGE } from '../../config';

export interface BotFactoryInstallOptions extends CoreOptions {
  npmClient: string,
  'dry-run': boolean,
  channel?: string,
  version?: string
}

export const botFactoryInstallOptions = (config: Config<ConfigV1Object>) => (yargs: Argv<CoreOptions>): Argv<BotFactoryInstallOptions> => {
  return yargs.version(false)
    .option('npmClient', { default: config.get('runtime.cli.npmClient') })
    .demandOption('npmClient')
    .option('dry-run', { type: 'boolean', default: false })
    .option('channel', { type: 'string' })
    .option('version', { type: 'string' });
};

export interface InstallOptions {
  npmClient: string,
  channel?: string,
  version?: string,
  'dry-run': boolean
}

export const install = () => async ({
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
