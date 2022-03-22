//
// Copyright 2022 DXOS.org
//

import assert from 'assert';

import { sleep } from '@dxos/async';
import { BotFactoryClient } from '@dxos/bot-factory-client';
import { PublicKey } from '@dxos/crypto';
import { NetworkManager } from '@dxos/network-manager';

const TIMEOUT = 10000;

interface BotFactoryConnectorOptions {
  signalEndpoint: string,
  topic: string,
  interval?: number
}

export class BotFactoryConnector {
  private readonly _topic: string;
  private readonly _interval: number;
  private readonly _signalEndpoint: string;

  constructor (options: BotFactoryConnectorOptions) {
    const { signalEndpoint, interval = 0, topic } = options;

    this._topic = topic;
    this._interval = Number(interval);
    this._signalEndpoint = signalEndpoint;
  }

  async start () {
    // Wait for BF initialization.
    await sleep(TIMEOUT);

    await this.connect();

    if (this._interval > 0) {
      return new Promise(() => {
        setInterval(this.connect.bind(this), this._interval);
      });
    }
  }

  async connect () {
    const networkManager = new NetworkManager({
      signal: [this._signalEndpoint],
      // ice: config.get('runtime.services.ice'),
      log: true
    });
    const botFactoryClient = new BotFactoryClient(networkManager);

    try {
      await botFactoryClient.start(PublicKey.from(this._topic));
      const bots = await botFactoryClient.list();

      console.log(`Connected to Bot Factory, ${bots.length} bots are running.`);
      await sleep(TIMEOUT);
    } catch (err) {
      console.error(err);
    } finally {
      await botFactoryClient.stop();
    }

    await networkManager.destroy();
  }
}

const [signalEndpoint, topic, interval] = process.argv.slice(2);

assert(signalEndpoint, 'Invalid Signal endpoint.');
assert(topic, 'Invalid topic.');

void new BotFactoryConnector({ signalEndpoint, topic, interval: Number(interval) }).start();
