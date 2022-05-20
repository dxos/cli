//
// Copyright 2022 DXOS.org
//

import { Argv, CommandModule } from 'yargs';

import { CoreOptions, asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { displayItem } from '../item';

export interface EchoRestoreOptions extends CoreOptions {
  itemId: string,
  props?: string
}

const options = (yargs: Argv<CoreOptions>): Argv<EchoRestoreOptions> => {
  return yargs
    .option('itemId', { type: 'string', required: true });
};

export const restoreCommand = (stateManager: StateManager): CommandModule<CoreOptions, EchoRestoreOptions> => ({
  command: ['restore'],
  describe: 'Restore ECHO item.',
  builder: (yargs: any) => options(yargs),

  handler: asyncHandler(async (argv: any) => {
    const { itemId, json } = argv;

    const party = await stateManager.getParty();
    const item = await party?.database.getItem(itemId);
    await item?.model.setProperty('deleted', false);

    print(displayItem(item), { json });
  })
});
