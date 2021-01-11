//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { keyPair } from 'hypercore-crypto';
import { EventEmitter } from 'events';
import readline from 'readline';

import { Messenger as MessengerPlugin } from '@dxos/protocol-plugin-messenger';
import { Presence } from '@dxos/protocol-plugin-presence';

import { asyncHandler } from '@dxos/cli-core';
import { humanize, keyToBuffer, keyToString, PublicKey } from '@dxos/crypto';
import { protocolFactory, MMSTTopology } from '@dxos/network-manager';
import { log } from '@dxos/debug';

const DEFAULT_TOPIC = '0000000000000000000000000000000000000000000000000000000000000000';

const MESSAGE_TYPE = 'chat';

/**
 * P2P messanger.
 */
class Messenger extends EventEmitter {
  /**
   * @constructor
   * @param {Buffer} peerId
   * @param {String} topic
   */
  constructor (peerId, topic) {
    super();
    assert(peerId);
    assert(topic);

    // TODO(burdon): Keep as buffer.
    this._peerId = peerId.toString('hex');
    this._topic = topic;

    this._readline = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false, // Prevent output from being echoed.
      prompt: `[${humanize(this._peerId)}] > `
    });

    this._messenger = new MessengerPlugin(peerId, (...args) => this._messageHandler(...args));
    this._presence = new Presence(peerId);

    this._presence.on('peer:joined', (remotePeerId) => this._logResponse(remotePeerId, 'joined the chat.'));
    this._presence.on('peer:exited', (remotePeerId) => this._logResponse(remotePeerId, 'left the chat.'));
  }

  get peerId () {
    return this._peerId;
  }

  get topic () {
    return this._topic;
  }

  createProtocolProvider () {
    const topicAsBuffer = keyToBuffer(this._topic);
    return protocolFactory({
      getTopics: () => {
        return [topicAsBuffer];
      },
      session: { peerId: keyToBuffer(this._peerId) },
      plugins: [this._messenger, this._presence]
    });
  }

  /**
   * Start chat client.
   * @return {Promise}
   */
  async start () {
    this._printHeader();

    return new Promise(resolve => {
      this._readline.prompt();
      this._readline.on('line', async input => {
        // TODO(burdon): Convert string parsing to protobuf.
        const connected = this._presence.peers.length - 1;
        const command = input.trim();
        try {
          switch (command) {
            case '@whoami':
              log(`PeerId(hex): ${this._peerId}`);
              break;
            case '@topic':
              log(`Topic(hex): ${this._topic}`);
              break;
            case '@peers':
              // TODO(burdon): Is ID a key or string?
              this._presence.peers.forEach(peerId => {
                log(` - ${peerId.toString('hex')}${peerId.toString('hex') === this._peerId ? ' (local)' : ''}`);
              });
              log(`${connected} peers connected.`);
              break;
            default:
              if (command) {
                await this.broadcastMessage(command);
              }
          }
          this._readline.prompt();
        } catch (err) {
          console.error(err);
          this._readline.prompt();
        }
      }).on('close', () => {
        resolve();
      });
    });
  }

  /**
   * Broadcast message to peers.
   * @param {string} message
   * @return {Promise<void>}
   */
  async broadcastMessage (message) {
    assert(message);
    this._messenger.broadcastMessage(MESSAGE_TYPE, Buffer.from(message)); // TODO(burdon): Hex?
  }

  /**
   * Log response message.
   * @param peerId
   * @param args
   * @private
   */
  _logResponse (peerId, ...args) {
    log(`\n\n[${humanize(peerId)}]`, ...args, '\n');
    this._readline.prompt();
  }

  /**
   * Message handler.
   */
  _messageHandler (protocol, { type, payload }) {
    const { peerId } = protocol.getSession();

    switch (type) {
      case MESSAGE_TYPE: {
        this._logResponse(peerId, '==>', payload.toString());
        break;
      }

      default: {
        throw new Error(`Unknown type: ${type}`);
      }
    }
  }

  /**
   * Output info.
   */
  _printHeader () {
    log(' ');
    log(`PeerId: ${this._peerId}`);
    log(`Topic: ${this._topic}`);
    log(' ');
  }
}

/**
 * Peer CLI module.
 */
export const PeerModule = ({ getClient }) => ({
  command: ['$0', 'peer'],
  describe: 'Peer-to-peer messaging.',
  builder: yargs => yargs
    .command({
      command: ['messenger'],
      describe: 'Messaging between peers by topic.',
      builder: yargs => yargs
        .option('topic', { alias: 't', type: 'string' })
        .option('generate-topic', { type: 'boolean', default: false }),

      handler: asyncHandler(async argv => {
        const { generateTopic } = argv;

        let { topic } = argv;

        if (generateTopic && !topic) {
          topic = keyToString(keyPair().publicKey);
        }

        topic = topic || DEFAULT_TOPIC;

        const peerId = keyPair().publicKey;
        const messenger = new Messenger(peerId, topic);

        const client = await getClient();

        await client.networkManager.joinProtocolSwarm({
          topic: PublicKey.from(keyToBuffer(topic)),
          protocol: messenger.createProtocolProvider(),
          peerId: PublicKey.from(peerId),
          topology: new MMSTTopology()
        });

        await messenger.start();
      })
    })
});
