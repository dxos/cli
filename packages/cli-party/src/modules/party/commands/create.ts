//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export const createCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyOptions> => ({
  command: ['create'],
  describe: 'Create party.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<PartyOptions>) => {
    const party = await stateManager.createParty();
    const data = { party: party.key.toHex() };
    return print(data, argv);
  })
});
