//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { getBlocks } from '../handlers/block';
import { deploy } from '../handlers/deploy';
import { addDummyData } from '../handlers/dummy-data';
import { info } from '../handlers/info';
import { getPeer } from '../handlers/peer';
import { seedRegistry } from '../handlers/seed';
import { setKeys } from '../handlers/setup';
import { Params } from '../interfaces';
import {
  accountCommand,
  auctionCommand,
  balanceCommand,
  domainCommand,
  recordCommand,
  resourceCommand,
  typeCommand,
  addressCommand
} from './commands';

export const DXNSModule = (params: Params) => {
  return {
    command: ['dxns', 'ns'],
    describe: 'DXNS operations.',
    builder: (yargs: Argv) => yargs
      .option('account', { type: 'string', array: false, describe: 'Optionally override DXNS Account from config.' })
      .command(typeCommand(params))
      .command(recordCommand(params))
      .command(resourceCommand(params))
      .command(balanceCommand(params))
      .command(domainCommand(params))
      .command(auctionCommand(params))
      .command(addressCommand(params))
      .command(accountCommand(params))

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
        command: ['seed'],
        describe: 'Seed DXNS.',
        builder: yargs => yargs
          .option('domain', { type: 'string' })
          .option('dataOnly', { type: 'boolean', description: 'Skip domain registration. Register data types only.' }),

        handler: asyncHandler(seedRegistry(params))
      })

      .command({
        command: ['block'],
        describe: 'Get current DXNS block number.',

        handler: asyncHandler(getBlocks(params))
      })

      .command({
        command: ['peer'],
        describe: 'Get Peer connection string.',
        builder: yargs => yargs
          .option('url', { type: 'string', required: true }),

        handler: asyncHandler(getPeer())
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
          .option('version', { type: 'string' })
          .option('skipExisting', { type: 'boolean' })
          .option('tag', { type: 'string' })
          .option('timeout', { type: 'string', default: '10m' })
          .option('path', { type: 'string' })
          .option('config', { type: 'string' })
          .option('hash-path', { type: 'string' }),

        handler: asyncHandler(async (argv: any) => {
          await deploy(params)(argv);
        })
      })

      .command({
        command: ['info'],
        describe: 'Print information about CLI Profile, HALO identity, DXNS Address, DXNS Account.',
        builder: yargs => yargs,
        handler: asyncHandler(info(params))
      })
  };
};
