//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { AccountKey } from '@dxos/registry-client';

import { Params } from '../interfaces';

export const listDomains = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const authorities = await client.registryClient.listAuthorities();

  print(authorities.map(authority => ({
    key: authority.key.toHex(),
    name: authority.domainName,
    owner: authority.owner
  })), { json });
};

export const getFreeDomain = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;
  const account = config.get('runtime.services.dxns.account');
  assert(account, 'Create a DXNS account using `dx dxns account create`');

  const { json } = argv;

  const client = await getDXNSClient();
  const domain = await client.registryClient.registerAuthority(AccountKey.fromHex(account));

  print({ key: domain.toHex() }, { json });
};
