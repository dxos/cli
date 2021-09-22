//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';

import { CliDataState } from '../../init';
import { infoCommand, inviteCommand, joinCommand } from './commands';

export type DeviceOptions = CoreOptions

const deviceOptions = (yargs: Argv<CoreOptions>): Argv<DeviceOptions> => {
  return yargs;
};

export const DeviceModule = ({ stateManager, config, profilePath }: CliDataState) => ({
  command: ['device'],
  describe: 'Device CLI.',
  handler: undefined as any,
  builder: (yargs: Argv<CoreOptions>) => deviceOptions(yargs)
    .command(joinCommand({ stateManager, config, profilePath }))
    .command(infoCommand(stateManager))
    .command(inviteCommand(stateManager))
});
