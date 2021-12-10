//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export const openCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyOptions> => ({
  command: ['open'],
  describe: 'Open a party.',
  builder: yargs => yargs
    .option('interactive', { hidden: true, default: true }), // override the default.
  handler: asyncHandler(async (argv: Arguments<PartyOptions>) => {
    const party = await stateManager.getParty();
    if (!party) {
      throw new Error('You don\'t have any available parties yet, create new one or use invitation to join existing party.');
    }
    await party.open();

    return print({ party: party.key.toHex() }, argv);
  })
});
