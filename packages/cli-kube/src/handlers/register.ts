//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import got from 'got';

import { CID, DomainKey, DXN, IRegistryClient, RecordKind } from '@dxos/registry-client';

export const KUBE_DXN_NAME = 'dxos:type.kube';
export const SERVICE_TYPE_DXN = 'dxos:type.service';
export const WELL_KNOWN = '/kube/services';

interface RegisterServiceOptions {
  registryClient: IRegistryClient,
  kubeCID: CID,
  domainKey: DomainKey,
  url: string
}

const getServiceTypeCID = async (registryClient: IRegistryClient, serviceName: string) => {
  // Checking for specific type, like dxos:type.service.app-server
  const cid = await registryClient.resolveRecordCid(DXN.parse(SERVICE_TYPE_DXN + '.' + serviceName));
  if (cid) {
    const record = await registryClient.getTypeRecord(cid);
    if (record) {
      return cid;
    }
  }
  // Can't resolve specific type, return default
  const defaultCID = await registryClient.resolveRecordCid(DXN.parse(SERVICE_TYPE_DXN));
  assert(defaultCID, 'Couldn\'t find default service type');
  return defaultCID;
};

const registerServices = async (options: RegisterServiceOptions) => {
  let services: any[] = [];
  try {
    const reponse = await got(`${options.url}${WELL_KNOWN}`);
    services = JSON.parse(reponse.body);
  } catch (e: unknown) {
    throw new Error('Kube service endpoint is not available');
  }
  for (const service of services) {
    const serviceTypeCid = await getServiceTypeCID(options.registryClient, service.name);

    const serviceData = {
      type: service.name,
      kube: options.kubeCID.value,
      extension: {
        '@type': serviceTypeCid.value
      }
    };

    const cid = await options.registryClient.insertDataRecord({ serviceData }, serviceTypeCid, {});

    const name = `${options.url.replace(':', '-')}.services.${service.name}`;
    await options.registryClient.registerResource(options.domainKey, name, cid);
  }
};

export const register = ({ getDXNSClient }: any) => async ({ domain, name, url }: any) => {
  const { registryClient }: { registryClient: IRegistryClient } = await getDXNSClient();

  const kubeType = await registryClient.getResource(DXN.parse(KUBE_DXN_NAME));
  assert(kubeType);
  assert(kubeType.record.kind === RecordKind.Type);

  const cid = await registryClient.insertDataRecord({
    url
  }, kubeType.record.cid, {
  });

  const domainKey = await registryClient.resolveDomainName(domain);
  await registryClient.registerResource(domainKey, name, cid);
  await registerServices({
    registryClient,
    domainKey,
    kubeCID: cid,
    url
  });
};
