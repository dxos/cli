//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import get from 'lodash.get';
import { boolean } from 'boolean';
import { spawnSync } from 'child_process';

import { sleep } from '@dxos/async';
import { Registry } from '@wirelineio/registry-client';

const TIMEOUT = 10000;
const RECORD_TYPE = 'wrn:service';
const SERVICE_TYPE = 'ipfs';
const SERVICE_EXEC = 'ipfs';

const connect = (address) => {
  const result = spawnSync(SERVICE_EXEC, ['swarm', 'connect', address]);
  console.log(String(result.stdout));
  console.error(String(result.stderr));
};

export class SwarmConnector {
  constructor (options) {
    const { registryEndpoint, chainId, interval = 0, allowIPv6 = false } = options;

    this._allowIPv6 = boolean(allowIPv6);
    this._interval = Number(interval);

    this._registry = new Registry(registryEndpoint, chainId);
  }

  async start () {
    // Wait for IPFS initialization.
    await sleep(TIMEOUT);

    await this.connect();

    if (this._interval > 0) {
      return new Promise(() => {
        setInterval(this.connect.bind(this), this._interval);
      });
    }
  }

  async connect () {
    const attributes = { type: RECORD_TYPE, service: SERVICE_TYPE };
    const services = await this._registry.queryRecords(attributes);

    // eslint-disable-next-line
    for (const service of services) {
      const addresses = get(service, 'attributes.ipfs.addresses', []);
      // eslint-disable-next-line
      for (const address of addresses) {
        if (/ip4/.test(address) || /dns4/.test(address) || this._allowIPv6) {
          connect(address);
        }
      }
    }
  }
}

const [registryEndpoint, chainId, interval, allowIPv6] = process.argv.slice(2);

assert(registryEndpoint, 'Invalid WNS endpoint.');
assert(chainId, 'Invalid WNS Chain ID.');

new SwarmConnector({ registryEndpoint, chainId, interval, allowIPv6 }).start();
