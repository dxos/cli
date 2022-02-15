//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { sleep } from '@dxos/async';
import { print } from '@dxos/cli-core';
import { AccountKey } from '@dxos/registry-client';

import { Params } from '../interfaces';

export const listAccount = (params: Params) => async (argv: any) => {
  const { config } = params;

  const { json } = argv;
  const account = config.get('runtime.services.dxns.dxnsAccount');

  print({ account }, { json });

  await sleep(2000);
};

export const createAccount = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const { accountClient } = await getDXNSClient();
  const account = await accountClient.createAccount();

  print({ account: account.toHex() }, { json });

  await sleep(2000);
  if (!json) {
    print('Manual step required: Put the account into your config > runtime > services > dxns > dxnsAccount');
  }
};

export const addDeviceToAccount = ({ getDXNSClient, config }: Params) => async (argv: {device: string[]}) => {
  const { device: devices } = argv;
  assert(devices, 'Device is required');

  const account = config.get('runtime.services.dxns.dxnsAccount');
  assert(account, 'Create an account using `dx dxns account create`.');

  const { accountClient } = await getDXNSClient();

  for (const device of devices) {
    await accountClient.addDeviceToAccount(AccountKey.fromHex(account), device);
  }
};

export const listDevices = ({ getDXNSClient, config }: Params) => async (argv: any) => {
  const { json } = argv;
  const { accountClient } = await getDXNSClient();

  const account = config.get('runtime.services.dxns.dxnsAccount');
  assert(account, 'Create an account using `dx dxns account create`.');

  const accountRecord = await accountClient.getAccount(AccountKey.fromHex(account));

  print({ devices: accountRecord?.devices.join('') }, { json });
};
