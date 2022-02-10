//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { addDataRecord, getRecord, listRecords } from '../../handlers/record';
import { Params } from '../../interfaces';

export const recordCommand = (params: Params): CommandModule => ({
  command: ['record'],
  describe: 'Registry records commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List all registered records.',
      handler: asyncHandler(listRecords(params))
    })

    .command({
      command: ['get <cid | dxn>'],
      describe: 'Get a record by its CID or DXN.',

      handler: asyncHandler(getRecord(params))
    })

    .command({
      command: ['add'],
      describe: 'Add a new record to the Registry.',
      builder: yargs => yargs
        .option('data', { required: true, describe: 'Data encoded in json.', type: 'string' })
        .option('schema', { required: true, describe: 'Schema cid', type: 'string' })
        .option('fqn', { required: true, describe: 'Message fully-qualified name inside the referenced schema.', type: 'string' })
        .option('name', { describe: 'Register a resource name for this record.', type: 'string' })
        .option('domain', { describe: 'Specify a domain key for the record.', type: 'string' }),

      handler: asyncHandler(addDataRecord(params))
    })
});
