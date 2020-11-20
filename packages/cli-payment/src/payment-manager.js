//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import pino from 'pino';
import { Wallet, utils, providers } from 'ethers';
import { TransferNames } from '@connext/vector-types';
import { RestServerNodeService, getRandomBytes32 } from '@connext/vector-utils';

const DEFAULT_TIMEOUT = '360000';

/**
 * Represents client connection to a Vector server node.
 */
export class PaymentManager {
  /**
   * @constructor
   * @param {Object} config
   */
  constructor (config) {
    assert(config);

    this._config = config;
    this._connected = false;
  }

  async connect () {
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

  async getChannelBalances (channelAddress) {
    assert(channelAddress, 'Invalid channel.');

    await this._connect();
    const channelResult = await this._service.getStateChannel({ channelAddress, publicIdentifier: this._service.publicIdentifier });
    if (channelResult.isError) {
      throw channelResult.getError();
    }

    const channel = channelResult.getValue();

    const { assetId } = this._config.get('services.payment');

    assert(assetId, 'Invalid asset ID.');

    const assetIdx = channel.assetIds.findIndex(id => id === assetId);

    const assetBalances = channel.balances[assetIdx];

    const balances = {};
    assetBalances.to.forEach((address, index) => {
      balances[address] = utils.formatEther(assetBalances.amount[index]);
    });

    return balances;
  }

  async addFunds (channelAddress, amount) {
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
    const result = await this._service.sendDepositTx({
      chainId: channel.networkContext.chainId,
      amount: utils.parseEther(amount).toString(),
      assetId,
      channelAddress: channel.channelAddress,
      publicIdentifier: this._service.publicIdentifier
    });

    if (result.isError) {
      throw result.getError();
    }

    const rpcProvider = new providers.JsonRpcProvider(provider);
    await rpcProvider.waitForTransaction(result.getValue().txHash);
  }

  async reconcileDeposit (channelAddress) {
    assert(channelAddress, 'Invalid channel.');

    const { assetId, provider } = this._config.get('services.payment');

    assert(assetId, 'Invalid asset ID.');
    assert(provider, 'Invalid payment provider endpoint.');

    await this._connect();
    const channelResult = await this._service.getStateChannel({ channelAddress, publicIdentifier: this._service.publicIdentifier });
    if (channelResult.isError) {
      throw channelResult.getError();
    }

    const channel = channelResult.getValue();
    const result = await this._service.reconcileDeposit({
      assetId,
      channelAddress: channel.channelAddress,
      publicIdentifier: this._service.publicIdentifier
    });

    if (result.isError) {
      throw result.getError();
    }
  }

  async createTransfer (channelAddress, amount) {
    assert(channelAddress, 'Invalid channel.');
    assert(amount, 'Invalid amount.');

    await this._connect();

    const { assetId } = this._config.get('services.payment');

    assert(assetId, 'Invalid asset ID.');

    const transferAmt = utils.parseEther(amount);
    const preImage = getRandomBytes32();
    const lockHash = utils.soliditySha256(['bytes32'], [preImage]);
    const result = await this._service.conditionalTransfer({
      amount: transferAmt.toString(),
      assetId,
      channelAddress,
      type: TransferNames.HashlockTransfer,
      details: {
        lockHash,
        expiry: '0'
      },
      publicIdentifier: this._service.publicIdentifier
    });

    if (result.isError) {
      throw result.getError();
    }

    const { transferId } = result.getValue();

    const coupon = {
      channelAddress,
      transferId,
      preImage
    };

    return Buffer.from(JSON.stringify(coupon)).toString('base64');
  }

  async redeemTransfer (coupon) {
    const {
      channelAddress,
      transferId,
      preImage
    } = JSON.parse(Buffer.from(coupon, 'base64').toString());

    const result = await this._service.resolveTransfer({
      publicIdentifier: this._service.publicIdentifier,
      channelAddress,
      transferResolver: {
        preImage
      },
      transferId
    });

    if (result.isError) {
      throw result.getError();
    }
  }

  async withdrawFunds (channelAddress, amount) {
    assert(channelAddress, 'Invalid channel.');
    assert(amount, 'Invalid amount.');

    const { assetId } = this._config.get('services.payment');

    assert(assetId, 'Invalid asset ID.');

    await this._connect();
    const result = await this._service.withdraw({
      publicIdentifier: this._service.publicIdentifier,
      channelAddress,
      amount: utils.parseEther(amount).toString(),
      assetId,
      recipient: this._service.signerAddress
    });

    if (result.isError) {
      throw result.getError();
    }
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
