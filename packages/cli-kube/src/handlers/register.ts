//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import got from 'got';

import { AccountKey, CID, DomainKey, DXN, RegistryClient } from '@dxos/registry-client';

export const KUBE_DXN_NAME = 'dxos:type/kube';
export const SERVICE_TYPE_DXN = 'dxos:type/service';
export const WELL_KNOWN = '/kube/services';

interface RegisterServiceOptions {
  kubeName: string,
  registryClient: RegistryClient,
  kubeCID: CID,
  domainKey: DomainKey,
  url: string,
  account: AccountKey
}

const getServiceTypeCID = async (registryClient: RegistryClient, serviceName: string) => {
  // Checking for specific type, like dxos:type/service/app-server
  const cid = (await registryClient.getResource(DXN.parse(SERVICE_TYPE_DXN + '/' + serviceName)));
  if (cid) {
    const record = await registryClient.getTypeRecord(cid);
    if (record) {
      return cid;
    }
  }
  return null;
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
    const generalServiceTypeCid = (await options.registryClient.getResource(DXN.parse(SERVICE_TYPE_DXN)))!;

    const serviceTypeCid = await getServiceTypeCID(options.registryClient, service.name) || generalServiceTypeCid;

    const serviceData = {
      type: service.name,
      kube: options.kubeCID.value,
      extension: {
        '@type': serviceTypeCid,
        ...(service.info || {})
      }
    };

    const cid = await options.registryClient.registerRecord(serviceData, generalServiceTypeCid, {});

    const path = `${options.kubeName}/service/${service.name}`;
    const name = DXN.fromDomainKey(options.domainKey, path, 'latest');
    await options.registryClient.registerResource(name, cid, options.account);
  }
};

export const register = ({ getDXNSClient }: any) => async (argv: any) => {
  // TODO(wittjosiah): Update options.
  const { domain, name: path, url } = argv;
  const { registryClient, getDXNSAccount } = await getDXNSClient();

  const kubeType = await registryClient.getResource(DXN.parse(KUBE_DXN_NAME));
  assert(kubeType);

  const cid = await registryClient.registerRecord({ url }, kubeType, {});
  const domainKey = await registryClient.getDomainKey(domain);
  const name = DXN.fromDomainKey(domainKey, path, 'latest');
  const account = await getDXNSAccount(argv);
  await registryClient.registerResource(name, cid, account);
  await registerServices({
    kubeName: path,
    registryClient,
    domainKey,
    kubeCID: cid,
    url,
    account
  });
};
