//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import pino from 'pino';
import { Wallet, utils, providers } from 'ethers';
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

  async getId () {
    await this._connect();

    return { id: this._service.publicIdentifier };
  }

  async getNodeInfo () {
    const { provider } = this._config.get('services.payment');

    assert(provider, 'Invalid payment provider endpoint.');

    await this._connect();

    const rpcProvider = new providers.JsonRpcProvider(provider);
    const balance = await rpcProvider.getBalance(this._service.signerAddress);

    return {
      id: this._service.publicIdentifier,
      address: this._service.signerAddress,
      balance: utils.formatEther(balance)
    };
  }

  async getWalletAddress () {
    const { mnemonic, provider } = this._config.get('services.payment');

    assert(mnemonic, 'Invalid account mnemonic.');
    assert(provider, 'Invalid payment provider endpoint.');

    const rpcProvider = new providers.JsonRpcProvider(provider);
    const wallet = Wallet.fromMnemonic(mnemonic).connect(rpcProvider);

    return wallet.address;
  }

  async getWalletBalance () {
    const { mnemonic, provider } = this._config.get('services.payment');

    assert(mnemonic, 'Invalid account mnemonic.');
    assert(provider, 'Invalid payment provider endpoint.');

    const rpcProvider = new providers.JsonRpcProvider(provider);
    const wallet = Wallet.fromMnemonic(mnemonic).connect(rpcProvider);

    const balance = await rpcProvider.getBalance(wallet.address);

    return utils.formatEther(balance);
  }

  async sendFunds (address, amount) {
    const { mnemonic, provider } = this._config.get('services.payment');

    assert(mnemonic, 'Invalid account mnemonic.');
    assert(provider, 'Invalid payment provider endpoint.');

    const rpcProvider = new providers.JsonRpcProvider(provider);
    const wallet = Wallet.fromMnemonic(mnemonic).connect(rpcProvider);

    const tx = await wallet.sendTransaction({ to: address, value: utils.parseEther(amount) });
    return tx.wait();
  }

  async listChannels () {
    await this._connect();

    const channelsResult = await this._service.getStateChannels({ publicIdentifier: this._service.publicIdentifier });
    if (channelsResult.isError) {
      throw channelsResult.getError();
    }

    return channelsResult.getValue();
  }

  async getChannelInfo (channelAddress) {
    assert(channelAddress, 'Invalid channel.');

    await this._connect();
    const channelResult = await this._service.getStateChannel({ channelAddress, publicIdentifier: this._service.publicIdentifier });
    if (channelResult.isError) {
      throw channelResult.getError();
    }

    const channel = channelResult.getValue();

    return channel;
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

  async sendDepositTx (channelAddress, amount) {
    assert(channelAddress, 'Invalid channel.');
    assert(amount, 'Invalid amount.');

    const { assetId, provider } = this._config.get('services.payment');

    assert(assetId, 'Invalid asset ID.');
    assert(provider, 'Invalid payment provider endpoint.');

    await this._connect();
    const channelResult = await this._service.getStateChannel({ channelAddress, publicIdentifier: this._service.publicIdentifier });
    if (channelResult.isError) {
      throw channelResult.getError();
    }

    const channel = channelResult.getValue();
    const depositAmt = utils.parseEther(amount);

    console.log({
      chainId: channel.networkContext.chainId,
      amount: depositAmt.toString(),
      assetId,
      channelAddress: channel.channelAddress,
      publicIdentifier: this._service.publicIdentifier
    });

    const depositTxRes = await this._service.sendDepositTx({
      chainId: channel.networkContext.chainId,
      amount: depositAmt.toString(),
      assetId,
      channelAddress: channel.channelAddress,
      publicIdentifier: this._service.publicIdentifier
    });

    if (depositTxRes.isError) {
      throw depositTxRes.getError();
    }

    const rpcProvider = new providers.JsonRpcProvider(provider);
    await rpcProvider.waitForTransaction(depositTxRes.getValue().txHash);
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
