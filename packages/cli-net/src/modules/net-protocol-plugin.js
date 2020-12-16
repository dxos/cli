//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import { EventEmitter } from 'events';

import { keyToString, keyToBuffer, createId } from '@dxos/crypto';
import { protocolFactory } from '@dxos/network-manager';
import { Extension } from '@dxos/protocol';

const log = debug('dxos:protocol:net');

const EXTENSION_NAME = 'dxos.net';

const getPeerId = (protocol) => {
  const { peerId } = protocol && protocol.getSession ? protocol.getSession() : {};
  return peerId;
};

export class NetProtocolPlugin extends EventEmitter {
  /** @type {Map<string, {Protocol}>} */
  _peers;

  /** @type {Buffer} */
  _nodeId;

  /**
   * @param {Buffer} nodeId
   */
  constructor (nodeId) {
    assert(Buffer.isBuffer(nodeId));
    super();

    this._nodeId = nodeId;
    this._peers = new Map();
  }

  /**
   * This node's id.
   * @return {Buffer}
   */
  get nodeId () {
    return this._nodeId;
  }

  /**
   * Array of the currently connected peers' node ids (not including our id).
   * @return {{Protocol}[]}
   */
  get peers () {
    return Array.from(this._peers.values());
  }

  /**
   * Factory function for Extensions (per-connection object).
   * Called when a new peer transport connection is established.
   * @return {Extension}
   */
  createExtension () {
    return new Extension(EXTENSION_NAME, { binary: true })
      .setMessageHandler(this._onMessage.bind(this))
      .setHandshakeHandler(this._onHandshake.bind(this))
      .setCloseHandler(this._onClose.bind(this));
  }

  /**
   * @param peerId {Buffer} Must be the value passed to the constructor on the responding node.
   * @param data {Buffer} Data to send
   * @param [oneway=false] {boolean} Whether to expect a response.
   */
  async send (peerId, data, oneway = false) {
    assert(Buffer.isBuffer(peerId));
    const peerIdStr = keyToString(peerId);
    const peer = this._peers.get(peerIdStr);

    if (!peer) {
      throw new Error(`No such peer: ${peerIdStr}`);
    }

    const extension = peer.getExtension(EXTENSION_NAME);
    if (!extension) {
      throw new Error(`No such extension: ${EXTENSION_NAME}`);
    }

    const requestId = createId();
    this.emit('send', peerId, { requestId, data });

    if (oneway) {
      await extension.send(data, { oneway });
      return;
    }

    const { response } = await extension.send(data, { oneway });
    this.emit('response', peerId, { requestId, response });
    return response;
  }

  async _onMessage (protocol, data) {
    const peerId = getPeerId(protocol);
    this.emit('receive', peerId, data.data);

    // echo
    const response = data.data;
    this.emit('respond', peerId, response);
    return response;
  }

  _onHandshake (protocol) {
    const peerId = getPeerId(protocol);
    const peerIdStr = keyToString(peerId);
    if (this._peers.has(peerIdStr)) {
      return;
    }

    this._peers.set(peerIdStr, protocol);
    this.emit('connect', peerId, protocol);
  }

  _onClose (protocol) {
    const peerId = getPeerId(protocol);
    if (peerId) {
      const peerIdStr = keyToString(peerId);
      if (this._peers.has(peerIdStr)) {
        this._peers.delete(peerId);
        this.emit('disconnect', peerId, protocol);
      }
    } else {
      // eslint-disable-next-line
      for (const [key, peer] of this._peers.entries()) {
        if (protocol === peer) {
          this._peers.delete(key);
          this.emit('disconnect', keyToBuffer(key), protocol);
        }
      }
    }
  }
}

export const netProtocolProvider = (swarmKey, nodeId) => {
  const plugin = new NetProtocolPlugin(nodeId);
  plugin.on('connect', (peerId) => {
    log(`connect: ${swarmKey.toString('hex')}.${peerId.toString('hex')}`);
  });
  plugin.on('disconnect', (peerId) => {
    log(`disconnect: ${swarmKey.toString('hex')}.${peerId.toString('hex')}`);
  });
  plugin.on('send', (peerId, { requestId, data }) => {
    log(`send: ${swarmKey.toString('hex')}.${peerId.toString('hex')} req: ${requestId} data: [${data.toString('hex')}]`);
  });
  plugin.on('response', (peerId, { requestId, response }) => {
    log(`response: ${swarmKey.toString('hex')}.${peerId.toString('hex')} req: ${requestId} response: [${response.data.toString('hex')}]`);
  });
  plugin.on('respond', (peerId, data) => {
    log(`respond: ${swarmKey.toString('hex')}.${peerId.toString('hex')} data: [${data.toString('hex')}]`);
  });
  plugin.on('receive', (peerId, data) => {
    log(`receive: ${swarmKey.toString('hex')}.${peerId.toString('hex')} data: [${data.toString('hex')}]`);
  });

  const provider = protocolFactory({
    getTopics: () => {
      return [swarmKey];
    },
    session: { peerId: nodeId },
    plugins: [plugin]
  });
  return { plugin, provider };
};
