//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { getBalance, increaseBalance } from '../../handlers/balance';
import { Params } from '../../interfaces';

export const balanceCommand = (params: Params): CommandModule => ({
  command: ['balance'],
  describe: 'Balance commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['get [address]'],
      describe: 'Get address balance.',
      builder: yargs => yargs
        .option('address', { type: 'string' }),

      handler: asyncHandler(getBalance(params))
    })

    .command({
      command: ['increase [address]'],
      describe: 'Increase address balance.',
      builder: yargs => yargs
        .option('address', { type: 'string' })
        .option('amount', { type: 'string' })
        .option('faucet', { type: 'string' }),

      handler: asyncHandler(increaseBalance(params))
    })
});
