//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { sleep } from '@dxos/async';
import { print } from '@dxos/cli-core';

import { Params } from '../interfaces';

export const listAccount = ({ config }: Params) => async (argv: any) => {
  const { json } = argv;
  const account = config.get('runtime.services.dxns.dxnsAccount');

  print({ account }, { json });

  await sleep(2000);
};

export const createAccount = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { json } = argv;
  const { accountClient } = await getDXNSClient();
  const account = await accountClient.createAccount();

  print({ account: account.toHex() }, { json });

  await sleep(2000);
  if (!json) {
    print('Manual step required: Put the account into your config > runtime > services > dxns > dxnsAccount');
  }
};

export const addDeviceToAccount = ({ getDXNSClient }: Params) => async (argv: {device: string[]}) => {
  const { device: devices } = argv;
  assert(devices, 'Device is required');

  const { accountClient, getDXNSAccount } = await getDXNSClient();
  const account = getDXNSAccount(argv);

  for (const device of devices) {
    await accountClient.addDeviceToAccount(account, device);
  }
};

export const listDevices = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { json } = argv;
  const { accountClient, getDXNSAccount } = await getDXNSClient();
  const account = getDXNSAccount(argv);

  const accountRecord = await accountClient.getAccount(account);

  print(accountRecord?.devices ?? [], { json });
};
