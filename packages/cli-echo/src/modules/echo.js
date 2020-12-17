//
// Copyright 2020 DXOS.org
//

// import assert from 'assert';
// import path from 'path';

import { asyncHandler, print } from '@dxos/cli-core';
// import { log } from '@dxos/debug';

import { ObjectModel } from '@dxos/object-model';
// import { humanize } from '@dxos/crypto';

const DEFAULT_ITEM_TYPE = 'wrn://dxos.org/item/general';

const displayItem = ({ id, type, parent, model }) => ({
  id,
  type,
  parent,
  props: JSON.stringify(model.toObject())
});

export const EchoModule = ({ stateManager }) => ({
  command: ['echo'],
  describe: 'Echo CLI.',
  builder: yargs => yargs
    .option('echo-key')

    .command({
      command: ['list'],
      describe: 'List echo items.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv) => {
        const { json } = argv;

        const items = stateManager.party.database.queryItems().value;
        const result = (items || []).map(item => {
          const modelName = Object.getPrototypeOf(item.model).constructor.name;
          return {
            id: item.id,
            // humanizedId: humanize(item.id),
            type: item.type,
            modelType: item.model._meta.type,
            modelName,
            deleted: !!item.model.toObject().deleted
          };
        });
        print(result, { json });
      })
    })

    .command({
      command: ['create'],
      describe: 'Create echo items.',
      builder: yargs => yargs
        .option('type', { default: DEFAULT_ITEM_TYPE })
        .option('parent')
        .option('props', { type: 'json' }),

      handler: asyncHandler(async (argv) => {
        const { type, parent, props, json } = argv;

        const item = await stateManager.party.database.createItem({
          model: ObjectModel,
          type,
          parent,
          props
        });

        print(displayItem(item), { json });
      })
    })

    .command({
      command: ['update'],
      describe: 'Update echo items.',
      builder: yargs => yargs
        .option('itemId')
        .option('props', { type: 'json' }),

      handler: asyncHandler(async (argv) => {
        const { props, itemId, json } = argv;

        const item = await stateManager.party.database.getItem(itemId);
        // eslint-disable-next-line
        for (const key in props) {
          await item.model.setProperty(key, props[key]);
        }

        print(displayItem(item), { json });
      })
    })

    .command({
      command: ['delete [itemId]'],
      describe: 'Delete echo items.',
      builder: yargs => yargs
        .option('itemId'),

      handler: asyncHandler(async (argv) => {
        const { itemId, json } = argv;

        const item = await stateManager.party.database.getItem(itemId);
        await item.model.setProperty('deleted', true);

        print(displayItem(item), { json });
      })
    })

    .command({
      command: ['restore [itemId]'],
      describe: 'Restore echo items.',
      builder: yargs => yargs
        .option('itemId'),

      handler: asyncHandler(async (argv) => {
        const { itemId, json } = argv;

        const item = await stateManager.party.database.getItem(itemId);
        await item.model.setProperty('deleted', false);

        print(displayItem(item), { json });
      })
    })
});
