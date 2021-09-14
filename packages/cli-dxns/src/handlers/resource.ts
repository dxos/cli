//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, Resource } from '@dxos/registry-api';

import { Params } from './common';
import { displayRecord } from './record';

const displayResource = (resource: Resource) => {
  return ({
    ...displayRecord(resource.record),
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

export const getResource = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { dxn, json } = argv;
  const parsedDxn = DXN.parse(dxn);

  const client = await getDXNSClient();
  const resource = await client.registryApi.get(parsedDxn);

  print(resource ? displayResource(resource) : undefined, { json });
};
