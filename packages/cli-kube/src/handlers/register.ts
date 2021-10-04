//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { DXN, IRegistryClient, RecordKind } from '@dxos/registry-client';

export const KUBE_DXN_NAME = 'dxos:type.kube';

export const register = ({ getDXNSClient }: any) => async ({ domain, name, url }: any) => {
  const { registryClient }: { registryClient: IRegistryClient } = await getDXNSClient();

  const kubeType = await registryClient.getResource(DXN.parse(KUBE_DXN_NAME));
  assert(kubeType);
  assert(kubeType.record.kind === RecordKind.Type);

  const cid = await registryClient.insertDataRecord({
    url
  }, kubeType.record.cid, {
    created: new Date()
  });

  const domainKey = await registryClient.resolveDomainName(domain);
  await registryClient.registerResource(domainKey, name, cid);
};
