//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { boolean } from 'boolean';
import { spawnSync } from 'child_process';
import get from 'lodash.get';

import { sleep } from '@dxos/async';
import { createApiPromise, IRegistryClient, RegistryClient } from '@dxos/registry-client';

const LIMIT = 5;
const TIMEOUT = 10000;
const RECORD_TYPE = 'wrn:service';
const SERVICE_TYPE = 'ipfs';
const SERVICE_EXEC = 'ipfs';
const SVC_NAME = 'ipfs-swarm-connect';

const connect = (address: string) => {
  const result = spawnSync(SERVICE_EXEC, ['swarm', 'connect', address]);
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
  private _registry: IRegistryClient | undefined;

  constructor (options: SwarmConnectorOptions) {
    const { registryEndpoint, interval = 0, allowIPv6 = false } = options;

    this._allowIPv6 = boolean(allowIPv6);
    this._interval = Number(interval);
    this._registryEndpoint = registryEndpoint;
  }

  async start () {
    // Wait for IPFS initialization.
    await sleep(TIMEOUT);

    await this.connect();

    const apiPromise = await createApiPromise(this._registryEndpoint);

    this._registry = new RegistryClient(apiPromise);

    if (this._interval > 0) {
      return new Promise(() => {
        setInterval(this.connect.bind(this), this._interval);
      });
    }
  }

  async connect () {
    if (!this._registry) {
      throw new Error('SwarmConnector is not started');
    }
    const attributes = { type: RECORD_TYPE, service: SERVICE_TYPE };
    const records = await this._registry?.getRecords();

    const active = records
      .filter(({ attributes: { active } }: any) => active !== false)
      .sort(() => Math.random() - 0.5);

    let servicesTried = 0;
    let connections = 0;
    // eslint-disable-next-line
    for (const service of active) {
      servicesTried++;

      const addresses = get(service, 'attributes.ipfs.addresses', []);
      // eslint-disable-next-line
      for (const address of addresses) {
        if (/ip4/.test(address) || /dns4/.test(address) || this._allowIPv6) {
          console.log(SVC_NAME, `connecting to ${get(service, 'names[0]', service.id)} @ ${address}`);
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

void new SwarmConnector({ registryEndpoint, interval, allowIPv6 }).start();
