//
// Copyright 2020 DXOS.org
//

import { Argv, Arguments } from 'yargs';

import { asyncHandler, CoreOptions, print } from '@dxos/cli-core';
import type { CliDataState } from '@dxos/cli-data';
import type { Item } from '@dxos/echo-db';
import { ObjectModel } from '@dxos/object-model';

const DEFAULT_ITEM_TYPE = 'wrn://dxos.org/item/general';

const displayItem = ({ id, type, parent, model }: any) => ({
  id,
  type,
  parent,
  props: JSON.stringify(model.toObject())
});

export const EchoModule = ({ stateManager }: CliDataState) => ({
  command: ['echo'],
  describe: 'ECHO database.',
  builder: (yargs: Argv<CoreOptions>) => yargs

    .command({
      command: ['list'],
      describe: 'List echo items.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv: Arguments<CoreOptions>) => {
        const { json } = argv;

        const party = await stateManager.getParty();
        const items: Item<any>[] = party?.database.select().query().value ?? [];
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
      builder: (yargs: any) => yargs
        .option('type', { default: DEFAULT_ITEM_TYPE })
        .option('parent')
        .option('props', { type: 'json' }),

      handler: asyncHandler(async (argv: any) => {
        const { type, parent, props, json } = argv;

        const party = await stateManager.getParty();
        const item = await party?.database.createItem({
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
      builder: (yargs: any) => yargs
        .option('itemId')
        .option('props', { type: 'json' }),

      handler: asyncHandler(async (argv: any) => {
        const { props, itemId, json } = argv;

        const party = await stateManager.getParty();
        const item = await party?.database.getItem(itemId);
        // eslint-disable-next-line
        for (const key in props) {
          await item?.model.setProperty(key, props[key]);
        }

        print(displayItem(item), { json });
      })
    })

    .command({
      command: ['delete [itemId]'],
      describe: 'Delete echo items.',
      builder: (yargs: any) => yargs
        .option('itemId'),

      handler: asyncHandler(async (argv: any) => {
        const { itemId, json } = argv;

        const party = await stateManager.getParty();
        const item = await party?.database.getItem(itemId);
        await item?.model.setProperty('deleted', true);

        print(displayItem(item), { json });
      })
    })

    .command({
      command: ['restore [itemId]'],
      describe: 'Restore echo items.',
      builder: (yargs: any) => yargs
        .option('itemId'),

      handler: asyncHandler(async (argv: any) => {
        const { itemId, json } = argv;

        const party = await stateManager.getParty();
        const item = await party?.database.getItem(itemId);
        await item?.model.setProperty('deleted', false);

        print(displayItem(item), { json });
      })
    })
});
