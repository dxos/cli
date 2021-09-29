//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { DXN, IRegistryApi, RecordKind } from '@dxos/registry-api';

export const KUBE_DXN_NAME = 'dxos:type.kube';

export const register = ({ getDXNSClient }: any) => async ({ domain, name, url }: any) => {
  const { registryApi }: { registryApi: IRegistryApi } = await getDXNSClient();

  const kubeType = await registryApi.getResource(DXN.parse(KUBE_DXN_NAME));
  assert(kubeType);
  assert(kubeType.record.kind === RecordKind.Type);

  const cid = await registryApi.insertDataRecord({
    url
  }, kubeType.record.cid, {
    created: new Date()
  });

  const domainKey = await registryApi.resolveDomainName(domain);
  await registryApi.registerResource(domainKey, name, cid);
};
