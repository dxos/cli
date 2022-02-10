//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import assert from 'assert';

import { Params } from '../interfaces';

export const listDomains = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const domains = await client.registryClient.getDomains();

  print(domains.map(domain => ({
    key: domain.key.toHex(),
    name: domain.name,
    owner: domain.owner
  })), { json });
};

export const getFreeDomain = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;
  const account = config.get('runtime.services.dxns.account')
  assert(account, 'Create a DXNS account using `dx dxns account`')

  const { json } = argv;

  const client = await getDXNSClient();
  const domain = await client.registryClient.registerDomain(account);

  print({ key: domain.toHex() }, { json });
};
