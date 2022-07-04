//
// Copyright 2022 DXOS.org
//

import { sleep } from '@dxos/async';
import { log } from '@dxos/debug';

import { Params } from '../interfaces';
import { createAccount } from './account';
import { generateAddress } from './address';
import { increaseBalance } from './balance';

export const signup = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;
  log('Generating DXNS address...');
  const generatedAddr = await generateAddress({ ...params, notVoid: true })(argv);
  await getDXNSClient(true);

  log('Increasing balance...');
  const { mnemonic, address } = generatedAddr!;
  await increaseBalance(params)({ ...argv, address });
  await sleep(5000);

  log('Registering DXNS account...');
  const generatedAcc = await createAccount({ ...params, notVoid: true })(argv);
  const { account } = generatedAcc!;

  log(`Sucessfully created DXNS address and account. Please note the command to restore the account (in case of storage reset): \n'dx ns account use --account ${account} && dx ns address use --mnemonic="${mnemonic}"'`);
};
