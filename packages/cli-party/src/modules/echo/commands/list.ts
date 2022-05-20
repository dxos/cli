//
// Copyright 2022 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { CoreOptions, asyncHandler, print } from '@dxos/cli-core';
import type { Item } from '@dxos/echo-db';

import { StateManager } from '../../../state-manager';

export const listCommand = (stateManager: StateManager): CommandModule<CoreOptions, CoreOptions> => ({
  command: ['list'],
  describe: 'List ECHO items.',
  builder: yargs => yargs,
  handler: asyncHandler(async (argv: Arguments<CoreOptions>) => {
    const { json } = argv;
    const party = await stateManager.getParty();
    const items: Item<any>[] = party?.database.select().query().entities ?? [];
    const result = (items || []).map(item => {
      const modelName = Object.getPrototypeOf(item.model).constructor.name;
      return {
        id: item.id,
        // humanizedId: humanize(item.id),
        type: item.type,
        modelType: item.model._meta.type,
        modelName,
        deleted: item.model.toObject && !!item.model.toObject()?.deleted
      };
    });
    print(result, { json });
  })
});
