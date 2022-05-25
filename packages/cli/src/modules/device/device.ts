//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions, CoreState, createClient } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { infoCommand, inviteCommand, joinCommand } from './commands';

export type DeviceOptions = CoreOptions

const deviceOptions = (yargs: Argv<CoreOptions>): Argv<DeviceOptions> => {
  return yargs;
};

export const DeviceModule = ({ config, profilePath, getReadlineInterface, cliState }: CoreState) => {
  const secretProvider = async () => {
    return new Promise(resolve => {
      const rl = getReadlineInterface!();
      rl.question('Passcode: ', (pin: string) => {
        resolve(pin);
      });
    });
  };

  const onPinGenerated = (pin: string) => {
    log('Pin: ', pin);
  };

  const getClient = async (name?: string) => {
    return createClient(config!, [], { name, initProfile: false });
  };

  const storage = config!.get('runtime.client.storage');

  return {
    command: ['device'],
    describe: 'Device management.',
    handler: undefined as any,
    builder: (yargs: Argv<CoreOptions>) => deviceOptions(yargs)
      .command(joinCommand({ storage, profilePath, cliState, getClient }, secretProvider))
      .command(infoCommand({ getClient }))
      .command(inviteCommand({ getClient }, onPinGenerated))
  };
};
