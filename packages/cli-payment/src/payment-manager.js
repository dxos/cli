//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import pino from 'pino';
import { RestServerNodeService } from '@connext/vector-utils';

const DEFAULT_TIMEOUT = '360000';

/**
 * Represents client connection to a Vector server node.
 */
export class PaymentManager {
  /**
   * @constructor
   * @param {Object} config
   * @param {Function} getReadlineInterface
   */
  constructor (config, getReadlineInterface) {
    assert(config);
    assert(getReadlineInterface);

    this._config = config;
    this._getReadlineInterface = getReadlineInterface;
    this._connected = false;
  }

  async getInfo () {
    await this._connect();

    return { publicIdentifier: this._service.publicIdentifier };
  }

  async setupChannel (counterpartyIdentifier) {
    assert(counterpartyIdentifier, 'Invalid counterparty ID.');

    const { chainId, timeout = DEFAULT_TIMEOUT } = this._config.get('services.payment');

    assert(chainId, 'Invalid chain ID.');

    await this._connect();
    const result = await this._service.setup({
      counterpartyIdentifier,
      chainId,
      timeout
    });

    if (result.isError) {
      throw result.getError();
    }

    const { channelAddress } = result.getValue();

    return { channelAddress };
  }

  async _connect () {
    if (!this._connected) {
      const { server } = this._config.get('services.payment');
      assert(server, 'Invalid payment server endpoint.');

      this._service = await RestServerNodeService.connect(server, pino(), undefined, 0);
      this._connected = true;
    }
  }
}
