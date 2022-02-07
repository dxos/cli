//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler, CoreState } from '@dxos/cli-core';

import { generateAccount, listAccounts, recoverAccount } from '../handlers/account';
import { createAuction, bidAuction, closeAuction, forceCloseAuction, claimAuction, listAuctions } from '../handlers/auction';
import { getBalance, increaseBalance } from '../handlers/balance';
import { getBlocks } from '../handlers/block';
import { build, publish, register } from '../handlers/deploy';
import { listDomains, getFreeDomain } from '../handlers/domain';
import { addDummyData } from '../handlers/dummy-data';
import { listRecords, getRecord, addDataRecord } from '../handlers/record';
import { deleteResource, getResource, listResources } from '../handlers/resource';
import { seedRegistry } from '../handlers/seed';
import { setKeys } from '../handlers/setup';
import { listTypes, getType, addType } from '../handlers/types';
import { DXNSClient } from '../index';

export interface Params extends CoreState {
  config: any,
  getDXNSClient(): Promise<DXNSClient>
}

export const DXNSModule = (params: Params) => {
  const { getDXNSClient, config } = params;
  return {
    command: ['dxns', 'ns'],
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
      })

      .command({
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
      })

      .command({
        command: ['resource'],
        describe: 'Registry resources commands.',
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

            handler: asyncHandler(getBalance(params))
          })

          .command({
            command: ['increase [account]'],
            describe: 'Increase account balance.',
            builder: yargs => yargs
              .option('account', { type: 'string' })
              .option('amount', { type: 'string' })
              .option('faucet', { type: 'string' }),

            handler: asyncHandler(increaseBalance(params))
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
            handler: asyncHandler(listDomains(params))
          })

          .command({
            command: ['create'],
            describe: 'Create free domain.',
            handler: asyncHandler(getFreeDomain(params))
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

            handler: asyncHandler(createAuction(params))
          })

          .command({
            command: ['bid <name> <amount>'],
            describe: 'Bid on a given name.',
            builder: yargs => yargs
              .option('name', { type: 'string' })
              .option('amount', { type: 'number' }),

            handler: asyncHandler(bidAuction(params))
          })

          .command({
            command: ['close <name>'],
            describe: 'Close an auction after the bidding period.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(closeAuction(params))
          })

          .command({
            command: ['force-close <name>'],
            describe: 'Force-closes an auction after the bidding period. Available in non-production environments.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(forceCloseAuction(params))
          })

          .command({
            command: ['claim <name>'],
            describe: 'Claim an auction, if the auction is closed and you are the winner.',
            builder: yargs => yargs
              .option('name', { type: 'string' }),

            handler: asyncHandler(claimAuction(params))
          })

          .command({
            command: ['list'],
            describe: 'List auctions.',

            handler: asyncHandler(listAuctions(params))
          })
      })

      .command({
        command: ['seed'],
        describe: 'Seed DXNS.',
        builder: yargs => yargs
          .option('domain', { type: 'string' })
          .option('dataOnly', { type: 'boolean', description: 'Skip domain registration. Register data types only.' }),

        handler: asyncHandler(seedRegistry(params))
      })

      .command({
        command: ['account'],
        describe: 'Account commands.',
        handler: () => {},
        builder: yargs => yargs
          .command({
            command: ['list'],
            describe: 'List accounts.',
            handler: asyncHandler(listAccounts(params))
          })
          .command({
            command: ['generate'],
            describe: 'Generate new account.',
            handler: asyncHandler(generateAccount())
          })
          .command({
            command: ['recover'],
            describe: 'Recover an existing DXNS account.',
            builder: yargs => yargs
              .option('mnemonic', { type: 'string', array: false }),
            handler: asyncHandler(recoverAccount(params))
          })
      })

      .command({
        command: ['block'],
        describe: 'Get current DXNS block number.',

        handler: asyncHandler(getBlocks(params))
      })

      .command({
        command: ['dummy'],
        describe: 'Adds all dummy data necessary for testing purposes.',

        handler: asyncHandler(addDummyData(params))
      })

      .command({
        command: ['deploy'],
        describe: 'Deploy and Register any DXOS entity.',

        builder: (yargs: Argv) => yargs
          .strict(false)
          .version(false)
          .option('name', { type: 'array' })
          .option('domain', { type: 'string' })
          .option('version', { type: 'string' })
          .option('skipExisting', { type: 'boolean' })
          .option('tag', { type: 'array' })
          .option('timeout', { type: 'string', default: '10m' })
          .option('path', { type: 'string' })
          .option('type', { type: 'string' })
          .option('hash-path', { type: 'string' }),

        handler: asyncHandler(async (argv: any) => {
          await build()(argv);
          const cid = await publish(config)(argv);
          await register({ cid, getDXNSClient })(argv);
        })
      })
  };
};
