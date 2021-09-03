//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const createCommand = (stateManager: StateManager): CommandModule => ({
  command: ['create'],
  describe: 'Create party.',
  builder: yargs => yargs
    .option('interactive', { hidden: true, default: true })
    .option('secured', { alias: 's', type: 'boolean', default: true }),

  handler: async (argv: any) => {
    const { json } = argv;

    const party = await stateManager.createParty();
    const data = { party: party.key.toHex() };
    print(data, { json });
    return data;
  }
});
