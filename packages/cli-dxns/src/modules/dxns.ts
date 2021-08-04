//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { generateAccount } from '../handlers/account';
import { createAuction, bidAuction, closeAuction, forceCloseAuction, claimAuction, listAuctions } from '../handlers/auction';
import { getBalance, increaseBalance } from '../handlers/balance';
import { getBlocks } from '../handlers/block';
import { listDomains, getFreeDomain } from '../handlers/domain';
import { listRecords, getRecords, addRecord } from '../handlers/record';
import { listResources } from '../handlers/resource';
import { listSchemas, querySchema, getSchema, addSchema } from '../handlers/schema';
import { seedRegistry } from '../handlers/seed';
import { setKeys } from '../handlers/setup';

interface Params {
  config: any,
  getDXNSClient: Function
}

export const DXNSModule = (params: Params) => {
  const { getDXNSClient, config } = params;
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

      .command({
        command: ['setup'],
        describe: 'DXNS Configuration commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['keys'],
            describe: 'Setup keys for single Node.',
            builder: yargs => yargs
              .option('mnemonic', { required: true, type: 'string' })
              .option('server', { required: true, type: 'string' })
              .option('type', { required: true, type: 'string' })
              .option('publicKey', { required: true, type: 'string' }),

            handler: asyncHandler(setKeys())
          })
      })

      .command({
        command: ['balance'],
        describe: 'Balance commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['get [account]'],
            describe: 'Get account balance.',
            builder: yargs => yargs
              .option('account', { type: 'string' }),

            handler: asyncHandler(getBalance({ getDXNSClient }))
          })

          .command({
            command: ['increase [account]'],
            describe: 'Increase account balance.',
            builder: yargs => yargs
              .option('account', { type: 'string' })
              .option('amount', { type: 'string' }),

            handler: asyncHandler(increaseBalance({ getDXNSClient }))
          })
      })

      .command({
        command: ['domain'],
        describe: 'Domain commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List domains.',
            handler: asyncHandler(listDomains({ getDXNSClient }))
          })

          .command({
            command: ['create'],
            describe: 'Create free domain.',
            handler: asyncHandler(getFreeDomain({ getDXNSClient }))
          })
      })

      .command({
        command: ['auction'],
        describe: 'Auction commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['create <name> <start-amount>'],
            describe: 'Create a new auction.',
            builder: yargs => yargs
              .option('name', { type: 'string' })
              .option('start-amount', { type: 'number' }),

            handler: asyncHandler(createAuction({ getDXNSClient }))
          })

          .command({
            command: ['bid <name> <amount>'],
            describe: 'Bid on a given name.',
            builder: yargs => yargs
              .option('name', { type: 'string' })
              .option('amount', { type: 'number' }),

            handler: asyncHandler(bidAuction({ getDXNSClient }))
          })

          .command({
            command: ['close <name>'],
            describe: 'Close an auction after the bidding period.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(closeAuction({ getDXNSClient }))
          })

          .command({
            command: ['force-close <name>'],
            describe: 'Force-closes an auction after the bidding period. Available in non-production environments.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(forceCloseAuction({ getDXNSClient }))
          })

          .command({
            command: ['claim <name>'],
            describe: 'Claim an auction, if the auction is closed and you are the winner.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(claimAuction({ getDXNSClient }))
          })

          .command({
            command: ['list'],
            describe: 'Claim an auction, if the auction is closed and you are the winner.',

            handler: asyncHandler(listAuctions({ getDXNSClient }))
          })
      })

      .command({
        command: ['seed'],
        describe: 'Seed DXNS.',
        builder: yargs => yargs
          .option('domain', { type: 'string' }),

        handler: asyncHandler(seedRegistry({ getDXNSClient, config }))
      })

      .command({
        command: ['account'],
        describe: 'Account commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['generate'],
            describe: 'Generate new account.',
            handler: asyncHandler(generateAccount())
          })
      })

      .command({
        command: ['block'],
        describe: 'Get current DXNS block number.',

        handler: asyncHandler(getBlocks({ getDXNSClient }))
      })
  };
};
