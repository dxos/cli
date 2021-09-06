//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';
import { StateManager } from '../../state-manager';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';

interface Params {
  stateManager: StateManager
}

export interface DeviceOptions extends CoreOptions {
}

const deviceOptions = (yargs: Argv<CoreOptions>): Argv<DeviceOptions> => {
  return yargs;
};

export const DeviceModule = ({ stateManager }: Params) => ({
  command: ['device'],
  describe: 'Device CLI.',
  handler: undefined as any,
  builder: (yargs: Argv<CoreOptions>) => deviceOptions(yargs)
    // .command(joinCommand(stateManager))
    .command(infoCommand(stateManager))
    // .command(openCommand(stateManager))
    .command(listCommand(stateManager))
    // .command(createCommand(stateManager))
    // .command(membersCommand(stateManager))
    // .command(inviteCommand(stateManager))
});
