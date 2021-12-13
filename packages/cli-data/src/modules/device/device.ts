//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { log } from '@dxos/debug';
import { CoreOptions } from '@dxos/cli-core';

import { CliDataState } from '../../init';
import { infoCommand, inviteCommand, joinCommand } from './commands';

export type DeviceOptions = CoreOptions

const deviceOptions = (yargs: Argv<CoreOptions>): Argv<DeviceOptions> => {
  return yargs;
};

export const DeviceModule = ({ stateManager, config, profilePath, getReadlineInterface }: CliDataState) => {
  const secretProvider = async () => {
    return new Promise(resolve => {
      const rl = getReadlineInterface!();
      rl.question('Passcode: ', (pin: string) => {
        resolve(pin);
      });
    })
  };

  const onPinGenerated = (pin: string) => {
    log('Pin: ', pin);
  };

  return {
    command: ['device'],
    describe: 'Device CLI.',
    handler: undefined as any,
    builder: (yargs: Argv<CoreOptions>) => deviceOptions(yargs)
      .command(joinCommand({ stateManager, config, profilePath }, secretProvider))
      .command(infoCommand(stateManager))
      .command(inviteCommand(stateManager, onPinGenerated))
    };
}