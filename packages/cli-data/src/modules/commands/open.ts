//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const openCommand = (stateManager: StateManager): CommandModule => ({
  command: ['open'],
  describe: 'Open a party.',
  builder: yargs => yargs
    .option('interactive', { hidden: true, default: true }),

  handler: async (argv: any) => {
    const { json } = argv;

    const party = await stateManager.getParty();
    if (!party) {
      throw new Error('You don\'t have any available parties yet, create new one or use invitation to join existing party.');
    }
    await party.open();

    print({ party: party.key.toHex() }, { json });
  }
});
