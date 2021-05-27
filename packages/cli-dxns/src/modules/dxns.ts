//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { listRecords, getRecords, addRecord } from '../handlers/record';
import { listResources } from '../handlers/resource';
import { listSchemas, querySchema, getSchema, addSchema } from '../handlers/schema';

interface Params {
  config: any,
  getDXNSClient: Function
}

export const DXNSModule = (params: Params) => {
  const { getDXNSClient } = params;
  return {
    command: ['dxns'],
    describe: 'DXNS operations.',
    builder: (yargs: Argv) => yargs
      .command({
        command: ['schema'],
        describe: 'Schema commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List schemas.',
            handler: asyncHandler(listSchemas({ getDXNSClient }))
          })

          .command({
            command: ['query <dxn>'],
            describe: 'Query schema by dxn.',
            builder: yargs => yargs
              .option('dxn', { type: 'string' }),

            handler: asyncHandler(querySchema({ getDXNSClient }))
          })

          .command({
            command: ['get <cid>'],
            describe: 'Get schema by cid.',
            builder: yargs => yargs
              .option('cid', { type: 'string' }),

            handler: asyncHandler(getSchema({ getDXNSClient }))
          })

          .command({
            command: ['add <path>'],
            describe: 'Add new schema.',
            builder: yargs => yargs
              .option('name', { describe: 'Name of the record.', type: 'string' })
              .option('domain', { describe: 'Domain key for the record.', type: 'string' })
              .option('path', { type: 'string' }),

            handler: asyncHandler(addSchema({ getDXNSClient }))
          })
      })

      .command({
        command: ['record'],
        describe: 'Record commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List records.',
            handler: asyncHandler(listRecords({ getDXNSClient }))
          })

          .command({
            command: ['get <id>'],
            describe: 'Get record.',
            builder: yargs => yargs
              .option('id', { type: 'string' }),

            handler: asyncHandler(getRecords({ getDXNSClient }))
          })

          .command({
            command: ['add'],
            describe: 'Add records',
            builder: yargs => yargs
              .option('data', { required: true, describe: 'Data encoded in json.', type: 'string' })
              .option('schema', { required: true, describe: 'Schema cid', type: 'string' })
              .option('fqn', { required: true, describe: 'Message fully-qualified name inside the referenced schema.', type: 'string' })
              .option('name', { describe: 'Register a resource name for this record.', type: 'string' })
              .option('domain', { describe: 'Specify a domain key for the record.', type: 'string' }),

            handler: asyncHandler(addRecord({ getDXNSClient }))
          })
      })

      .command({
        command: ['resource'],
        describe: 'Resource commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List resources.',
            handler: asyncHandler(listResources({ getDXNSClient }))
          })
      })
  };
};
