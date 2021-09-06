//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export const infoCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyOptions> => ({
  command: ['info'],
  describe: 'Current party info.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<PartyOptions>) => {
    const { json } = argv;

    const party = await stateManager.getParty();

    print({ party: party?.key.toHex() }, { json });
  })
});
