//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import { EventEmitter } from 'events';
import get from 'lodash.get';

import { keyToString, createId } from '@dxos/crypto';
import { protocolFactory } from '@dxos/network-manager';
import { Extension } from '@dxos/protocol';

const log = debug('dxos:protocol:net');

const EXTENSION_NAME = 'dxos.net';

const getPeerId = (protocol) => {
  const { peerId } = protocol && protocol.getSession ? protocol.getSession() : {};
  return peerId;
};

const webrtcDetails = async (protocol) => {
  const peer = get(protocol, 'stream._readableState.pipes');
  if (!peer) {
    return {};
  }
  const rawStats = [...await peer._pc.getStats()];
  const nominated = {};

  if (rawStats && rawStats.length) {
    const activePair = rawStats.find(s => s[1].type === 'candidate-pair' && s[1].nominated);
    if (activePair) {
      // eslint-disable-next-line prefer-destructuring
      nominated.pair = activePair[1];
      // eslint-disable-next-line prefer-destructuring
      nominated.remote = rawStats.find(s => nominated.pair.remoteCandidateId === s[1].id)[1];
      // eslint-disable-next-line prefer-destructuring
      nominated.local = rawStats.find(s => nominated.pair.localCandidateId === s[1].id)[1];
    }
  }

  const stats = {
    bytes: {
      sent: get(nominated, 'pair.bytesSent', -1),
      received: get(nominated, 'pair.bytesReceived', -1)
    },
    requests: {
      sent: get(nominated, 'pair.requestsSent', -1),
      received: get(nominated, 'pair.requestsReceived', -1)
    },
    responses: {
      sent: get(nominated, 'pair.responsesSent', -1),
      received: get(nominated, 'pair.responsesReceived', -1)
    }
  };

  const candidates = {
    local: {
      id: get(nominated, 'pair.localCandidateId'),
      type: get(nominated, 'local.candidateType'),
      ip: get(nominated, 'local.ip', peer.localAddress),
      port: get(nominated, 'local.port', peer.localPort),
      protocol: get(nominated, 'local.protocol'),
      relayProtocol: get(nominated, 'local.relayProtocol')
    },
    remote: {
      id: get(nominated, 'pair.remoteCandidateId'),
      type: get(nominated, 'remote.candidateType'),
      ip: get(nominated, 'remote.ip', peer.remoteAddress),
      port: get(nominated, 'remote.port', peer.remotePort),
      protocol: get(nominated, 'remote.protocol')
    }
  };
  return { candidates, stats };
};

const aboutPeer = async (protocol) => {
  const peer = get(protocol, 'stream._readableState.pipes');
  return {
    socket: {
      channelName: peer.channelName,
      config: peer.config,
      localAddress: peer.localAddress,
      localFamily: peer.localFamily,
      localPort: peer.localPort,
      remoteAddress: peer.remoteAddress,
      remoteFamily: peer.remoteFamily,
      remotePort: peer.remotePort
    },
    webrtc: await webrtcDetails(protocol)
  };
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
    const protocol = this._peers.get(peerIdStr);

    if (!protocol) {
      throw new Error(`No such peer: ${peerIdStr}`);
    }

    const extension = protocol.getExtension(EXTENSION_NAME);
    if (!extension) {
      throw new Error(`No such extension: ${EXTENSION_NAME}`);
    }

    const requestId = createId();
    this.emit('send', { peerId, requestId, protocol, data, infoProvider: () => aboutPeer(protocol) });

    if (oneway) {
      await extension.send(data, { oneway });
      return;
    }

    const { response } = await extension.send(data, { oneway });
    this.emit('response', { peerId, requestId, response, infoProvider: () => aboutPeer(protocol) });
    return response;
  }

  async _onMessage (protocol, { data }) {
    const peerId = getPeerId(protocol);
    this.emit('receive', { peerId, data, protocol, infoProvider: () => aboutPeer(protocol) });

    // echo
    const response = data;
    this.emit('receive', { peerId, response, protocol, infoProvider: () => aboutPeer(protocol) });
    return response;
  }

  _onHandshake (protocol) {
    const peerId = getPeerId(protocol);
    const peerIdStr = keyToString(peerId);
    if (this._peers.has(peerIdStr)) {
      return;
    }

    this._peers.set(peerIdStr, protocol);
    this.emit('connect', { peerId, protocol, infoProvider: () => aboutPeer(protocol) });
  }

  _onClose (protocol) {
    const peerId = getPeerId(protocol);
    if (peerId) {
      const peerIdStr = keyToString(peerId);
      if (this._peers.has(peerIdStr)) {
        this._peers.delete(peerId);
        this.emit('disconnect', { peerId });
      }
    } else {
      // eslint-disable-next-line
      for (const [key, peer] of this._peers.entries()) {
        if (protocol === peer) {
          this._peers.delete(key);
          this.emit('disconnect', { peerId });
        }
      }
    }
  }
}

export const netProtocolProvider = (swarmKey, nodeId) => {
  const plugin = new NetProtocolPlugin(nodeId);
  plugin.on('connect', ({ peerId }) => {
    log(`connect: ${swarmKey.toString('hex')}.${peerId.toString('hex')}`);
  });
  plugin.on('disconnect', ({ peerId }) => {
    log(`disconnect: ${swarmKey.toString('hex')}.${peerId.toString('hex')}`);
  });
  plugin.on('send', ({ peerId, requestId, data }) => {
    log(`send: ${swarmKey.toString('hex')}.${peerId.toString('hex')} req: ${requestId} data: [${data.toString('hex')}]`);
  });
  plugin.on('response', ({ peerId, requestId, response }) => {
    log(`response: ${swarmKey.toString('hex')}.${peerId.toString('hex')} req: ${requestId} response: [${response.data.toString('hex')}]`);
  });
  plugin.on('respond', ({ peerId, data }) => {
    log(`respond: ${swarmKey.toString('hex')}.${peerId.toString('hex')} data: [${data.toString('hex')}]`);
  });
  plugin.on('receive', ({ peerId, data }) => {
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
