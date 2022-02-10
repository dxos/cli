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
});
