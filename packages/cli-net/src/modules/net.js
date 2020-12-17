//
// Copyright 2020 DXOS.org
//

import performanceNow from 'performance-now';

import { trigger, sleep, runWithTimeout, waitForCondition } from '@dxos/async';
import { asyncHandler, print } from '@dxos/cli-core';
import { PublicKey, randomBytes } from '@dxos/crypto';
import { NetworkManager, MMSTTopology, StarTopology } from '@dxos/network-manager';

import { netProtocolProvider } from './net-protocol-plugin';

const createNetworkManager = async (config, swarm, target) => {
  const signal = [config.get('services.signal').server];
  const ice = config.get('services.ice');

  const networkManager = new NetworkManager({ signal, ice });
  await networkManager.start();

  const nodeId = PublicKey.from(randomBytes());
  const topology = target ? new StarTopology(target) : new MMSTTopology();

  const { plugin: net, provider } = netProtocolProvider(swarm.asBuffer(), nodeId.asBuffer());

  const join = () => networkManager.joinProtocolSwarm({ topic: swarm, peerId: nodeId, protocol: provider, topology });

  return { nodeId, net, networkManager, join };
};

/**
 * Net CLI module.
 */
export const NetModule = ({ config }) => {
  return ({
    command: ['net'],
    describe: 'Net CLI.',
    builder: yargs => yargs

      .command({
        command: ['ping <swarm> [target]'],
        describe: 'ping',
        builder: yargs => yargs
          .positional('swarm', { type: 'string', required: true })
          .positional('target', { type: 'string', required: false })
          .option('timeout', { type: 'number', default: 10000 })
          .option('bytes', { type: 'bytes', default: 56 })
          .strict(),

        handler: asyncHandler(async (argv) => {
          let run = true;
          let rc = 0;

          let leave = async () => {};
          const cleanExit = async () => {
            await sleep(100);
            await leave();
            process.exit(rc);
          };

          process.on('SIGINT', async () => {
            run = false;
          });

          const { swarm, target, timeout, bytes } = argv;

          const { net, join } = await createNetworkManager(config,
            PublicKey.from(swarm),
            target ? PublicKey.from(target) : undefined);

          const [connected, setConnected] = trigger();
          net.on('connect', setConnected);

          print(`PING ${swarm} (${target || '<any>'}): ${bytes} data bytes`);

          const start = performanceNow();
          leave = join();

          net.on('connect', async ({ peerId, infoProvider }) => {
            setConnected(peerId);
            const connInfo = await infoProvider();
            const elapsed = performanceNow() - start;

            const peerStr = `${peerId.toString('hex')} (${connInfo.socket.remoteAddress}:${connInfo.socket.remotePort}/` +
            `${connInfo.webrtc.candidates.remote.protocol} ${connInfo.webrtc.candidates.local.type})`;
            print(`connected to ${peerStr} time=${elapsed.toFixed(3)} ms`);

            // eslint-disable-next-line
            while (run) {
              const start = performanceNow();
              const data = Buffer.from(randomBytes(bytes));
              const response = await net.send(peerId, data);
              const elapsed = performanceNow() - start;
              print(`${response.data.length} bytes from ${peerStr} time=${elapsed.toFixed(3)} ms`);
              await sleep(750);
            }
          });

          try {
            await runWithTimeout(connected, timeout);
          } catch (e) {
            console.error('ERROR:', e.message);
            rc = 1;
            run = false;
          }
          await waitForCondition(() => !run);
          await cleanExit(rc);
        })
      })
      .command({
        command: ['listen <swarm>'],
        describe: 'listen',
        builder: yargs => yargs
          .positional('swarm', { type: 'string', required: true })
          .strict(),

        handler: asyncHandler(async (argv) => {
          const { swarm } = argv;
          let run = true;

          process.on('SIGINT', async () => {
            run = false;
          });

          const { nodeId, net, join } = await createNetworkManager(config, PublicKey.from(swarm));
          const leave = join();
          print(`LISTEN ${swarm} (${nodeId.toHex()})`);

          net.on('connect', async ({ peerId, infoProvider }) => {
            const connInfo = await infoProvider();
            const peerStr = `${peerId.toString('hex')} (${connInfo.socket.remoteAddress}:${connInfo.socket.remotePort}/` +
              `${connInfo.webrtc.candidates.remote.protocol} ${connInfo.webrtc.candidates.local.type})`;
            print(`connect: ${peerStr}`);
          });

          net.on('receive', ({ peerId, data }) => {
            print(`receive: ${peerId.toString('hex')} ${data.length} bytes`);
          });

          net.on('disconnect', ({ peerId }) => {
            print(`disconnect: ${peerId.toString('hex')}`);
          });

          await waitForCondition(() => !run);
          await leave();
          process.exit(0);
        })
      })
  });
};
