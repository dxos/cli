//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { deleteResource, getResource, listResources } from '../../handlers/resource';
import { Params } from '../../interfaces';

export const resourceCommand = (params: Params): CommandModule => ({
  command: ['resource'],
  describe: 'Resource commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List all known resources in the Registry.',
      handler: asyncHandler(listResources(params))
    })

    .command({
      command: ['get <dxn>'],
      describe: 'Get a resource by its DXN.',
      handler: asyncHandler(getResource(params))
    })

    .command({
      command: ['delete <dxn>'],
      describe: 'Delete a resource by its DXN.',
      handler: asyncHandler(deleteResource(params))
    })
});
