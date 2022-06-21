//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { AccountKey, DXN } from '@dxos/registry-client';

import { Params } from '../interfaces';
import { displayResource } from './common';

export const listResources = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  let resources = await client.registryClient.listResources();

  if (argv.account) {
    const account = await client.accountClient.getAccount(AccountKey.fromHex(argv.account));
    assert(account, 'DXNS Account not found.');
    const accountAuthorities = (await client.registryClient.listAuthorities())
      .filter(authority => AccountKey.equals(authority.owner, account.id));

    resources = resources.filter(resource => accountAuthorities.findIndex(authority =>
      typeof resource.name.authority === 'string'
        ? resource.name.authority === authority.domainName
        : resource.name.authority.toString() === authority.key.toString()
    ) !== -1);
  }

  print(resources.map(displayResource), { json });
};

export const getResource = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { dxn, json } = argv;
  const parsedDxn = DXN.parse(dxn);

  const client = await getDXNSClient();
  const resource = await client.registryClient.getResource(parsedDxn);

  print({ cid: resource?.toString() }, { json });
};

export const deleteResource = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { dxn } = argv;
  const parsedDxn = DXN.parse(dxn);

  const client = await getDXNSClient();
  const account = await client.getDXNSAccount(argv);

  await client.registryClient.registerResource(parsedDxn, undefined, account);
};
