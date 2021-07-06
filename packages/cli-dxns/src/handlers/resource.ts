//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { Resource } from '@dxos/registry-api';

import { Params } from './common';
import { displayRecord } from './record';

const displayResource = (resource: Resource) => {
  return ({
    ...displayRecord(resource),
    id: resource.id.toString()
  });
};

export const listResources = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const resources = await client.registryApi.getResources();

  print(resources.map(displayResource), { json });
};
