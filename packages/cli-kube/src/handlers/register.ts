//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import got from 'got';

import { CID, DXN, IRegistryClient, RecordKind } from '@dxos/registry-client';

export const KUBE_DXN_NAME = 'dxos:type.kube';
export const SERVICE_TYPE_DXN = 'dxos:type.service';

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
  assert(defaultCID);
  return defaultCID;
};

const registerServices = async (registryClient: IRegistryClient, kubeCID: CID, url: string) => {
  const reponse = await got(`https://${url}/kube/services`);
  const services = JSON.parse(reponse.body);
  await Promise.all(services.map(async (service: any) => {
    const serviceTypeCid = await getServiceTypeCID(registryClient, service.name);

    const serviceData = {
      type: service.name,
      kube: kubeCID.value,
      extension: {
        '@type': serviceTypeCid.value
      }
    };

    await registryClient.insertDataRecord(serviceData, serviceTypeCid);
  }));
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
  await registerServices(registryClient, cid, url);
};
