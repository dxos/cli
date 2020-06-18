//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';
import path from 'path';
import get from 'lodash.get';
import fs from 'fs';
import { spawnSync } from 'child_process';

import { Runnable, stopService, asyncHandler, print } from '@dxos/cli-core';
import { Registry } from '@wirelineio/registry-client';

const IPFS_EXEC = 'ipfs';
const IPFS_PROCESS_NAME = 'ipfs';
const IPFS_DEFAULT_LOG_FILE = '/var/log/ipfs.log';

const IPFS_SWARM_CONNECTOR_EXEC = 'node';
const IPFS_SWARM_CONNECTOR_PROCESS_NAME = 'ipfs-swarm-connect';
const IPFS_SWARM_CONNECTOR_PATH = path.join(__dirname, '../runnable/swarm-connect.js');
const IPFS_SWARM_CONNECTOR_DEFAULT_LOG_FILE = '/var/log/ipfs-swarm-connect.log';

const RECORD_TYPE = 'wrn:service';
const SERVICE_TYPE = 'ipfs';

const APP_TYPE = 'wrn:app';
const BOT_TYPE = 'wrn:bot';

const ipfsRunnable = new Runnable(IPFS_EXEC);
const swarmConnectRunable = new Runnable(IPFS_SWARM_CONNECTOR_EXEC, [IPFS_SWARM_CONNECTOR_PATH]);

/**
 * IPFS CLI module.
 */
export const IPFSModule = ({ config }) => ({
  command: ['ipfs'],
  describe: 'IPFS CLI.',
  builder: yargs => yargs

    .command({
      command: ['start'],
      describe: 'Start ipfs.',
      builder: yargs => yargs
        .option('daemon', { type: 'boolean', default: false })
        .option('log-file', { type: 'string', default: IPFS_DEFAULT_LOG_FILE })
        .option('proc-name', { type: 'string', default: IPFS_PROCESS_NAME })
        .option('wns-bootstrap', {
          describe: 'Start with WNS bootstrap',
          type: 'boolean',
          default: true
        })
        .option('connect-interval', { type: 'number', default: 300 })
        .option('connect-ipv6', { type: 'boolean', default: false })
        .option('max-memory', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { logFile, daemon, procName, forward, connectInterval, connectIpv6, wnsBootstrap, maxMemory } = argv;
        const forwardArgs = forward ? JSON.parse(forward).args : [];

        if (wnsBootstrap && connectInterval >= 0) {
          const swarmConnectorOptions = {
            name: IPFS_SWARM_CONNECTOR_PROCESS_NAME,
            detached: daemon,
            singleInstance: true,
            logFile: IPFS_SWARM_CONNECTOR_DEFAULT_LOG_FILE,
            background: true
          };
          const { server, chainId } = config.get('services.wns');
          await swarmConnectRunable.run(
            [server, chainId, connectInterval * 1000, connectIpv6],
            swarmConnectorOptions
          );
        }

        const ipfsOptions = {
          name: procName,
          detached: daemon,
          singleInstance: true,
          logFile,
          maxMemory
        };
        await ipfsRunnable.run(['daemon', '--writable', ...forwardArgs], ipfsOptions);
      })
    })

    .command({
      command: ['stop'],
      describe: 'Stop IPFS.',
      builder: yargs => yargs
        .option('proc-name', { type: 'string', default: IPFS_PROCESS_NAME }),

      handler: asyncHandler(async argv => {
        const { procName } = argv;
        await stopService(procName);
        await stopService(IPFS_SWARM_CONNECTOR_PROCESS_NAME);
      })
    })

    .command({
      command: ['status'],
      describe: 'Get IPFS status.',
      builder: yargs => yargs,

      handler: asyncHandler(async () => {
        const data = spawnSync(IPFS_EXEC, ['version']);
        const result = String(data.stdout);

        const [, version] = result.match(/ipfs version ([0-9\\.]+)/i);

        print({ version }, { json: true });
      })
    })

    .command({
      command: ['find [thing] [name]'],
      describe: 'Find file in IPFS swarm.',
      builder: yargs => yargs
        .option('platform', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { json, name, platform } = argv;
        let { thing } = argv;

        if (!thing) {
          thing = fs.readFileSync(0, 'utf-8');
        }

        let hash;
        if (/Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(thing)) {
          hash = thing;
        }

        if (!hash) {
          assert(name, 'Invalid Name.');
          const { server, chainId } = config.get('services.wns');
          const registry = new Registry(server, chainId);

          switch (thing) {
            case 'app': {
              const apps = await registry.queryRecords({ type: APP_TYPE, name });
              assert(apps[0], 'App not found in WNS.');
              hash = get(apps, '[0].attributes.package');
              break;
            }
            case 'bot': {
              assert(platform, 'Invalid platform.');
              const bots = await registry.queryRecords({ type: BOT_TYPE, name });
              assert(bots[0], 'Bot not found in WNS.');
              hash = get(bots, `[0].attributes.package.${platform.replace('-', '.')}`);
              break;
            }
            default: {
              throw new Error(`Invalid type "${thing}".`);
            }
          }
        }

        assert(hash, 'Invalid Hash.');

        const { server, chainId } = config.get('services.wns');
        const registry = new Registry(server, chainId);

        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const attributes = { type: RECORD_TYPE, service: SERVICE_TYPE };
        const services = await registry.queryRecords(attributes);

        const addresses = services.reduce((prev, service) => {
          const addrs = get(service, 'attributes.ipfs.addresses', []);
          return [...prev, ...addrs];
        }, []);

        // Find in IPFS.
        const data = spawnSync(IPFS_EXEC, ['--timeout', '10s', 'dht', 'findprovs', hash.trim()]);
        const found = String(data.stdout).split('\n');

        const result = found.filter(Boolean).map(hash => {
          const address = addresses.find(addr => addr.includes(hash));
          if (address) {
            return { node: address, registered: true };
          }
          return { node: hash, registered: false };
        });

        const wnsRegisteredCount = result.filter(({ registered }) => registered).length;

        const info = {
          ...(thing !== hash ? { name, type: thing } : {}),
          hash,
          'wns-registered-nodes-found': wnsRegisteredCount,
          'non-wns-registered-nodes-found': result.length - wnsRegisteredCount
        };

        if (json) {
          print({ ...info, result }, { json });
        } else {
          print(info, { json });
          print(result, { json });
        }
      })
    })
});
