//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export const listCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyOptions> => ({
  command: ['list'],
  describe: 'List parties.',
  builder: yargs => yargs,

  handler: asyncHandler(async (argv: Arguments<PartyOptions>) => {
    const current = await stateManager.getParty();
    const parties = (await stateManager.getClient()).echo.queryParties().value.map(({ key }) => ({
      party: key.toHex(),
      current: current && key.equals(current?.key)
    }));

    return print(parties, argv);
  })
});
