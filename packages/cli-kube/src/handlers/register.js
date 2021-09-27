//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { DXN } from '@dxos/registry-api';

export const KUBE_DXN_NAME = 'dxos:type.kube';

export const register = ({ getDXNSClient }) => async ({ domain, name, url }) => {
  const { registryApi } = await getDXNSClient();

  const kubeType = await registryApi.get(DXN.parse(KUBE_DXN_NAME));
  assert(kubeType);
  assert(kubeType.record.kind === 'type');

  const cid = await registryApi.insertDataRecord({
    url
  }, kubeType.record.cid, {
    created: new Date().toISOString()
  });

  const domainKey = await registryApi.resolveDomainName(domain);
  await registryApi.registerResource(domainKey, name, cid);
};
