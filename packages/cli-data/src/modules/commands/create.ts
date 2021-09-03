//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const createCommand = (stateManager: StateManager): CommandModule => ({
  command: ['create'],
  describe: 'Create party.',
  builder: yargs => yargs
    .option('interactive', { hidden: true, default: true })
    .option('secured', { alias: 's', type: 'boolean', default: true }),

  handler: asyncHandler(async (argv: any) => {
    const { json } = argv;

    const party = await stateManager.createParty();
    print({ party: party.key.toHex() }, { json });
  })
});
