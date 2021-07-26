//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { Params } from './common';

export const listDomains = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const domains = await client.registryApi.getDomains();

  print(domains.map((domain: any) => ({
    domainKey: domain.domainKey.toHex(),
    name: domain.name,
    owners: domain.owners
  })), { json });
};

export const getFreeDomain = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const domain = await client.registryApi.registerDomain();

  print({ domainKey: domain.toHex() }, { json });
};
