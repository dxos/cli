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
    const { json } = argv;

    const parties = Array.from(stateManager.parties.values()).map(({ partyKey, ...rest }) => ({
      party: partyKey,
      ...rest,
      current: partyKey === stateManager.currentParty
    }));

    print(parties, { json });
    return parties;
  })
});
