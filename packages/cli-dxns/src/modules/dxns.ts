//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

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
  typeCommand
} from './commands';

export const DXNSModule = (params: Params) => {
  return {
    command: ['dxns', 'ns'],
    describe: 'DXNS operations.',
    builder: (yargs: Argv) => yargs
      .command(typeCommand(params))
      .command(recordCommand(params))
      .command(resourceCommand(params))
      .command(balanceCommand(params))
      .command(domainCommand(params))
      .command(auctionCommand(params))
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
  };
};
