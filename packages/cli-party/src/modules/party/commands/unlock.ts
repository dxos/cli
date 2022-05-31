//
// Copyright 2022 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { PartyOptions } from '../party';

export const unlockCommand = (stateManager: StateManager): CommandModule<PartyOptions, PartyOptions> => ({
  command: ['unlock'],
  describe: 'Force-unlock current party.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<PartyOptions>) => {
    await stateManager.unlock(true);
  })
});
