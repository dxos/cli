//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { addType, getType, listTypes } from '../../handlers/types';
import { Params } from '../../interfaces';

export const typeCommand = (params: Params): CommandModule => ({
  command: ['type'],
  describe: 'Registry types commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List all known types in the Registry.',
      handler: asyncHandler(listTypes(params))
    })

    .command({
      command: ['get <cid | dxn>'],
      describe: 'Get type details by its CID or DXN.',

      handler: asyncHandler(getType(params))
    })

    .command({
      command: ['add <messageName> <path>'],
      describe: 'Add a new type to the Registry.',
      builder: yargs => yargs
        .option('messageName', { required: true, describe: 'The fully qualified name of the proto message (must exist in the proto file).', type: 'string' })
        .option('path', { required: true, describe: 'Path to the proto file', type: 'string' })
        .option('domain', { describe: 'Domain key for the record.', type: 'string' })
        .option('resourceName', { describe: 'Name of the resource in DXN', type: 'string' })
        .option('version', { describe: 'Version of the type', type: 'string' })
        .option('description', { describe: 'Description of the type', type: 'string' }),

      handler: asyncHandler(addType(params))
    })
});
