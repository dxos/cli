//
// Copyright 2022 DXOS.org
//

import { Argv, CommandModule } from 'yargs';

import { CoreOptions, asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { displayItem } from '../item';

export interface EchoDeleteOptions extends CoreOptions {
  itemId: string,
  props?: string
}

const options = (yargs: Argv<CoreOptions>): Argv<EchoDeleteOptions> => {
  return yargs
    .option('itemId', { type: 'string', required: true });
};

export const deleteCommand = (stateManager: StateManager): CommandModule<CoreOptions, EchoDeleteOptions> => ({
  command: ['delete'],
  describe: 'Delete ECHO item.',
  builder: (yargs: any) => options(yargs),

  handler: asyncHandler(async (argv: any) => {
    const { itemId, json } = argv;

    const party = await stateManager.getParty();
    const item = await party?.database.getItem(itemId);
    await item?.model.setProperty('deleted', true);

    print(displayItem(item), { json });
  })
});
