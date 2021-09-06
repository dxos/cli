//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export const infoCommand = (stateManager: StateManager): CommandModule => ({
  command: ['info'],
  describe: 'Current party info.',
  builder: yargs => yargs,
  handler: async (argv: Arguments<PartyOptions>) => {
    const { json } = argv;

    print({ party: stateManager.currentParty }, { json });
  }
});
