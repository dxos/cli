//
// Copyright 2022 DXOS.org
//

import { Argv, CommandModule } from 'yargs';

import { CoreOptions, asyncHandler, print } from '@dxos/cli-core';

import { StateManager } from '../../../state-manager';
import { displayItem } from '../item';

export interface EchoUpdateOptions extends CoreOptions {
  itemId: string,
  props?: string
}

const options = (yargs: Argv<CoreOptions>): Argv<EchoUpdateOptions> => {
  return yargs
    .option('itemId', { type: 'string', required: true })
    .option('props', { type: 'string' });
};

export const updateCommand = (stateManager: StateManager): CommandModule<CoreOptions, EchoUpdateOptions> => ({
  command: ['update'],
  describe: 'Create ECHO items.',
  builder: (yargs: any) => options(yargs),

  handler: asyncHandler(async (argv: any) => {
    const { props, itemId, json } = argv;

    const party = await stateManager.getParty();
    const item = await party?.database.getItem(itemId);

    for (const key in JSON.parse(props)) {
      await item?.model.setProperty(key, props[key]);
    }

    print(displayItem(item), { json });
  })
});
