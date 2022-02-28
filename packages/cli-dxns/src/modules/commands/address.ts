//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { generateAddress, listAddress, recoverAddress } from '../../handlers/address';
import { Params } from '../../interfaces';

export const addressCommand = (params: Params): CommandModule => ({
  command: ['address'],
  describe: 'Polkadot Address commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List Polkadot Addresses.',
      handler: asyncHandler(listAddress(params))
    })
    .command({
      command: ['generate'],
      describe: 'Generate new Polkadot Address.',
      handler: asyncHandler(generateAddress())
    })
    .command({
      command: ['recover'],
      describe: 'Recover an existing Polkadot Address.',
      builder: yargs => yargs
        .option('mnemonic', { type: 'string', array: false }),
      handler: asyncHandler(recoverAddress(params))
    })
});
