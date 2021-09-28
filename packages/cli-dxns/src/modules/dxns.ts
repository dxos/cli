//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

// TODO(marcin): simplify with index.ts
import { generateAccount, listAccounts } from '../handlers/account';
import { createAuction, bidAuction, closeAuction, forceCloseAuction, claimAuction, listAuctions } from '../handlers/auction';
import { getBalance, increaseBalance } from '../handlers/balance';
import { getBlocks } from '../handlers/block';
import { listDomains, getFreeDomain } from '../handlers/domain';
import { listRecords, getRecord, addDataRecord } from '../handlers/record';
import { getResource, listResources } from '../handlers/resource';
import { seedRegistry } from '../handlers/seed';
import { setKeys } from '../handlers/setup';
import { listTypes, getType, addType } from '../handlers/types';
import { DXNSClient } from '../index';

interface Params {
  config: any,
  getDXNSClient(): DXNSClient
}

export const DXNSModule = (params: Params) => {
  const { getDXNSClient, config } = params;
  return {
    command: ['dxns'],
    describe: 'DXNS operations.',
    builder: (yargs: Argv) => yargs
      .command({
        command: ['type'],
        describe: 'Registry types commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List all known types in the Registry.',
            handler: asyncHandler(listTypes({ getDXNSClient }))
          })

          .command({
            command: ['get <cid | dxn>'],
            describe: 'Get type details by its CID or DXN.',
            builder: yargs => yargs
              .option('cid', { describe: 'CID of the type', type: 'string' }),
            // TODO(marcin): support dxn with -dxn switch
            // .option('dxn', { describe: 'DXN of the type', type: 'string' }),

            handler: asyncHandler(getType({ getDXNSClient }))
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
              .option('description', { describe: 'Description of the type', type: 'string' })
              .option('author', { describe: 'Author of the type', type: 'string' }),

            handler: asyncHandler(addType({ getDXNSClient }))
          })
      })

      .command({
        command: ['record'],
        describe: 'Registry records commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List all registered records.',
            handler: asyncHandler(listRecords({ getDXNSClient }))
          })

          .command({
            command: ['get <cid>'],
            describe: 'Get a record by its CID.',
            builder: yargs => yargs
              .option('cid', { type: 'string' }),

            handler: asyncHandler(getRecord({ getDXNSClient }))
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

            handler: asyncHandler(addDataRecord({ getDXNSClient }))
          })
      })

      .command({
        command: ['resource'],
        describe: 'Registry resources commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List all known resources in the Registry.',
            handler: asyncHandler(listResources({ getDXNSClient }))
          })

          .command({
            command: ['get <dxn>'],
            describe: 'Get a resource by its DXN.',
            handler: asyncHandler(getResource({ getDXNSClient }))
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
            describe: 'List auctions.',

            handler: asyncHandler(listAuctions({ getDXNSClient }))
          })
      })

      .command({
        command: ['seed'],
        describe: 'Seed DXNS.',
        builder: yargs => yargs
          .option('domain', { type: 'string' })
          .option('dataOnly', { type: 'boolean', description: 'Skip domain registration. Register data types only.' }),

        handler: asyncHandler(seedRegistry({ getDXNSClient, config }))
      })

      .command({
        command: ['account'],
        describe: 'Account commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List accounts.',
            handler: asyncHandler(listAccounts({ getDXNSClient, config }))
          })
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
