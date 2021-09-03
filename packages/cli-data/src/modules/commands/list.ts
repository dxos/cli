//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const listCommand = (stateManager: StateManager): CommandModule => ({
  command: ['list'],
  describe: 'List parties.',
  builder: yargs => yargs,

  handler: async (argv: any) => {
    const { json } = argv;

    const parties = Array.from(stateManager.parties.values()).map(({ partyKey, ...rest }) => ({
      party: partyKey,
      ...rest,
      current: partyKey === stateManager.currentParty
    }));

    print(parties, { json });
    return parties;
  }
});
