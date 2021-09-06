//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export const createCommand = (stateManager: StateManager): CommandModule => ({
  command: ['create'],
  describe: 'Create party.',
  builder: yargs => yargs,
  handler: async (argv: Arguments<PartyOptions>) => {
    const { json } = argv;

    const party = await stateManager.createParty();
    const data = { party: party.key.toHex() };
    print(data, { json });
    return data;
  }
});
