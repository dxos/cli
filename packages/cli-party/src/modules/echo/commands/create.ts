//
// Copyright 2022 DXOS.org
//

import { Argv, CommandModule } from 'yargs';

import { CoreOptions, asyncHandler, print } from '@dxos/cli-core';
import { ObjectModel } from '@dxos/object-model';

import { StateManager } from '../../../state-manager';
import { displayItem } from '../item';

const DEFAULT_ITEM_TYPE = 'dxn://dxos/item/general';

export interface EchoCreateOptions extends CoreOptions {
  type?: string,
  parent?: string,
  props?: string
}

const options = (yargs: Argv<CoreOptions>): Argv<EchoCreateOptions> => {
  return yargs
    .option('type', { type: 'string', default: DEFAULT_ITEM_TYPE })
    .option('parent', { type: 'string' })
    .option('props', { type: 'string' });
};

export const createCommand = (stateManager: StateManager): CommandModule<CoreOptions, EchoCreateOptions> => ({
  command: ['create'],
  describe: 'Create ECHO items.',
  builder: (yargs: any) => options(yargs),

  handler: asyncHandler(async (argv: any) => {
    const { type, parent, props, json } = argv;

    const party = await stateManager.getParty();
    const item = await party?.database.createItem({
      model: ObjectModel,
      type,
      parent,
      props: JSON.parse(props)
    });

    print(displayItem(item), { json });
  })
});
