//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { generateAccount, listAccounts, recoverAccount } from '../../handlers/account';
import { Params } from '../../interfaces';

export const accountCommand = (params: Params): CommandModule => ({
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
});
