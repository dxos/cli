//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export const openCommand = (stateManager: StateManager): CommandModule => ({
  command: ['open'],
  describe: 'Open a party.',
  builder: yargs => yargs,
  handler: async (argv: Arguments<PartyOptions>) => {
    const { json } = argv;

    const party = await stateManager.getParty();
    if (!party) {
      throw new Error('You don\'t have any available parties yet, create new one or use invitation to join existing party.');
    }
    await party.open();

    print({ party: party.key.toHex() }, { json });
  }
});
