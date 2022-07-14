//
// Copyright 2021 DXOS.org
//

import { ApiPromise, WsProvider } from '@polkadot/api';
import assert from 'assert';
import { boolean } from 'boolean';
import { spawnSync } from 'child_process';

import { sleep } from '@dxos/async';
import { DXN, RegistryClient, definitions, PolkadotRegistry, RegistryRecord } from '@dxos/registry-client';

const OLD_RECORD_CREATED = '2001-01-01';

const LIMIT = 5;
const TIMEOUT = 10000;
const SERVICE_EXEC = 'kube';
const SVC_NAME = 'ipfs-swarm-connect';
const IPFS_SERVICE_DXN = 'dxos:type/service/ipfs';
const SERVICE_DXN = 'dxos:type/service';

const connect = (address: string) => {
  const result = spawnSync(SERVICE_EXEC, ['ipfs', 'swarm', 'connect', address]);
  const out = String(result.stdout).trim();
  const err = String(result.stderr).trim();
  if (out) {
    console.log(SVC_NAME, out);
  }
  if (err) {
    console.error(SVC_NAME, err);
  }
  return result.status;
};

interface SwarmConnectorOptions {
  registryEndpoint: string,
  interval?: number,
  allowIPv6?: boolean
}

export class SwarmConnector {
  private readonly _allowIPv6: boolean;
  private readonly _interval: number;
  private readonly _registryEndpoint: string;
  private _registry: RegistryClient | undefined;

  constructor (options: SwarmConnectorOptions) {
    const { registryEndpoint, interval = 0, allowIPv6 = false } = options;

    this._allowIPv6 = boolean(allowIPv6);
    this._interval = Number(interval);
    this._registryEndpoint = registryEndpoint;
  }

  async start () {
    // Wait for IPFS initialization.
    await sleep(TIMEOUT);

    const provider = new WsProvider(this._registryEndpoint);
    const types = Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
    const api = await ApiPromise.create({ provider, types });

    this._registry = new RegistryClient(new PolkadotRegistry(api));

    await this.connect();

    if (this._interval > 0) {
      return new Promise(() => {
        setInterval(this.connect.bind(this), this._interval);
      });
    }
  }

  async getServiceTypeCID (dxn: string) {
    if (!this._registry) {
      throw new Error('Registry client is not initialized.');
    }
    const type = await this._registry.getResource(DXN.parse(dxn));
    if (!type) {
      throw new Error('Can\'t find ipfs service type record');
    }
    return type;
  }

  async connect () {
    if (!this._registry) {
      throw new Error('Registry client is not initialized.');
    }
    const ipfsServiceCID = await this.getServiceTypeCID(IPFS_SERVICE_DXN);
    const serviceCID = await this.getServiceTypeCID(SERVICE_DXN);
    const services = await this._registry.listRecords({ type: serviceCID });

    const getDate = (record: RegistryRecord) => new Date(record.created ?? OLD_RECORD_CREATED).getTime();

    // Find last service record for each registered IPFS service.
    const records = services
      .filter(service => ipfsServiceCID.equals(service.payload.extension['@type']))
      .sort((recordA: RegistryRecord, recordB: RegistryRecord) => getDate(recordA) - getDate(recordB)).reverse()
      .filter((record, index, self) => {
        return index === self.findIndex(r => r.payload.extension.addresses[0].split('/').pop() === record.payload.extension.addresses[0].split('/').pop());
      });

    const active = records.sort(() => Math.random() - 0.5); // assuming all are active?

    let servicesTried = 0;
    let connections = 0;
    // eslint-disable-next-line
    for (const service of active) {
      servicesTried++;

      const addresses = service.payload.extension.addresses as string[];
      // eslint-disable-next-line
      for (const address of addresses ?? []) {
        if (/ip4/.test(address) || /dns4/.test(address) || this._allowIPv6) {
          console.log(SVC_NAME, `connecting to @ ${address}`);
          if (connect(address) === 0) {
            connections++;
            break;
          }
        }
      }

      console.log(SVC_NAME, `${connections} connections established (${servicesTried} attempts).`);
      if (connections >= LIMIT) {
        break;
      }
    }
  }
}

const [registryEndpoint, interval, allowIPv6] = process.argv.slice(2);

assert(registryEndpoint, 'Invalid DXNS endpoint.');

void new SwarmConnector({ registryEndpoint, interval: Number(interval), allowIPv6: boolean(allowIPv6) }).start();
