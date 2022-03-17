//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { sleep } from '@dxos/async';
import { print } from '@dxos/cli-core';
import { AccountKey } from '@dxos/registry-client';

import { Params } from '../interfaces';
import { DXNS_ACCOUNT_PREFERENCE } from '../utils';

export const listAccount = (params: Params) => async (argv: any) => {
  const { json } = argv;
  const { getDXNSAccount } = await params.getDXNSClient();
  const account = await getDXNSAccount(argv);

  print({ account: account.toHex() }, { json });

  await sleep(2000);
};

export const createAccount = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { json } = argv;
  const { accountClient, dxosClient } = await getDXNSClient();
  const account = await accountClient.createAccount();
  await dxosClient.halo.setGlobalPreference(DXNS_ACCOUNT_PREFERENCE, account.toHex());

  print({ account: account.toHex() }, { json });

  await sleep(2000);
};

export const restoreAccount = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { account: accKey, json } = argv;
  const account = AccountKey.fromHex(accKey);

  const { dxosClient } = await getDXNSClient();
  await dxosClient.halo.setGlobalPreference(DXNS_ACCOUNT_PREFERENCE, account.toHex());

  print({ account: account.toHex() }, { json });

  await sleep(2000);
};

export const addDeviceToAccount = ({ getDXNSClient }: Params) => async (argv: {device: string[]}) => {
  const { device: devices } = argv;
  assert(devices, 'Device is required');

  const { accountClient, getDXNSAccount } = await getDXNSClient();
  const account = await getDXNSAccount(argv);

  for (const device of devices) {
    await accountClient.addDeviceToAccount(account, device);
  }
};

export const listDevices = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { json } = argv;
  const { accountClient, getDXNSAccount } = await getDXNSClient();
  const account = await getDXNSAccount(argv);

  const accountRecord = await accountClient.getAccount(account);

  print(accountRecord?.devices ?? [], { json });
};
