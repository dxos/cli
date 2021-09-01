//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const infoCommand = (stateManager: StateManager): CommandModule => ({
  command: ['info'],
  describe: 'Current party info.',
  builder: yargs => yargs,

  handler: asyncHandler(async (argv: any) => {
    const { json } = argv;

    print({ party: stateManager.currentParty }, { json });
  })
});
