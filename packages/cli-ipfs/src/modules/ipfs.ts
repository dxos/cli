//
// Copyright 2020 DXOS.org
//

import { spawnSync } from 'child_process';
import path from 'path';
import { Argv } from 'yargs';

import { Runnable, stopService, asyncHandler, print } from '@dxos/cli-core';
import type { DXNSClient } from '@dxos/cli-dxns';

import { init, install, publish, register, query /*, download */ } from '../handlers';

const IPFS_EXEC = 'kube';
const IPFS_PROCESS_NAME = 'kube';
const IPFS_DEFAULT_LOG_FILE = '/var/log/kube.log';

const IPFS_SWARM_CONNECTOR_EXEC = 'node';
const IPFS_SWARM_CONNECTOR_PROCESS_NAME = 'ipfs-swarm-connect';
const IPFS_SWARM_CONNECTOR_PATH = path.join(__dirname, '../runnable/swarm-connect.js');
const IPFS_SWARM_CONNECTOR_DEFAULT_LOG_FILE = '/var/log/ipfs-swarm-connect.log';

// const RECORD_TYPE = 'dxn:service';
// const SERVICE_TYPE = 'ipfs';

const ipfsRunnable = new Runnable(IPFS_EXEC);
const swarmConnectRunable = new Runnable(IPFS_SWARM_CONNECTOR_EXEC, [IPFS_SWARM_CONNECTOR_PATH]);

export interface Params {
  config: any,
  getDXNSClient(): Promise<DXNSClient>,
}

/**
 * IPFS CLI module.
 */
export const IPFSModule = ({ config, getDXNSClient }: Params) => ({
  command: ['ipfs'],
  describe: 'IPFS CLI.',
  builder: (yargs: Argv) => yargs

    .command({
      command: ['start'],
      describe: 'Start ipfs.',
      builder: yargs => yargs
        .option('daemon', { type: 'boolean', default: false })
        .option('log-file', { type: 'string', default: IPFS_DEFAULT_LOG_FILE })
        .option('proc-name', { type: 'string', default: IPFS_PROCESS_NAME })
        .option('dxns-bootstrap', {
          describe: 'Start with DXNS bootstrap',
          type: 'boolean',
          default: true
        })
        .option('connect-interval', { type: 'number', default: 300 })
        .option('connect-ipv6', { type: 'boolean', default: false })
        .option('max-memory', { type: 'string' })
        .option('init', { type: 'boolean', default: false }),

      handler: asyncHandler(async (argv: any) => {
        const { init: initRequired, logFile, daemon, procName, forward, connectInterval, connectIpv6, dxnsBootstrap, maxMemory } = argv;
        const forwardArgs = forward ? JSON.parse(forward).args : [];

        if (initRequired) {
          await init()();
        }

        if (dxnsBootstrap && connectInterval >= 0) {
          const swarmConnectorOptions = {
            name: IPFS_SWARM_CONNECTOR_PROCESS_NAME,
            detached: daemon,
            singleInstance: true,
            logFile: IPFS_SWARM_CONNECTOR_DEFAULT_LOG_FILE,
            background: true,
            startTimeout: 10000
          };
          const { server } = config.get('runtime.services.dxns');
          await swarmConnectRunable.run(
            [server, connectInterval * 1000, connectIpv6],
            swarmConnectorOptions
          );
        }

        const ipfsOptions = {
          name: procName,
          detached: daemon,
          singleInstance: true,
          logFile,
          maxMemory,
          startTimeout: 10000
        };
        await ipfsRunnable.run(['daemon', '--writable', ...forwardArgs], ipfsOptions);
      })
    })

    .command({
      command: ['stop'],
      describe: 'Stop IPFS.',
      builder: yargs => yargs
        .option('proc-name', { type: 'string', default: IPFS_PROCESS_NAME }),

      handler: asyncHandler(async (argv: any) => {
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

        const match = result.match(/ipfs version ([0-9\\.]+)/i);
        if (!match) {
          throw new Error('IPFS is not running.');
        }

        const [, version] = match;
        print({ version }, { json: true });
      })
    })

  // .command({
  //   command: ['find [thing] [name]'],
  //   describe: 'Find file in IPFS swarm.',
  //   builder: yargs => yargs
  //     .option('platform', { type: 'string' }),

  //   handler: asyncHandler(async argv => {
  //     const { server, chainId } = config.get('runtime.services.wns');
  //     assert(server, 'Invalid WNS endpoint.');
  //     assert(chainId, 'Invalid WNS Chain ID.');

  //     const registry = new Registry(server, chainId);

  //     const { json, name, platform } = argv;
  //     let { thing } = argv;

  //     if (!thing) {
  //       thing = fs.readFileSync(0, 'utf-8');
  //     }

  //     let hash;
  //     if (/Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(thing)) {
  //       hash = thing;
  //     }

  //     if (!hash) {
  //       assert(name, 'Invalid Name.');

  //       switch (thing) {
  //         case 'app':
  //         case 'file': {
  //           const { records } = await registry.resolveNames([name]);
  //           assert(records[0], 'Item not found in WNS.');
  //           hash = get(records, '[0].attributes.package["/"]');
  //           break;
  //         }
  //         case 'bot': {
  //           assert(platform, 'Invalid platform.');
  //           const { records: bots } = await registry.resolveNames([name]);
  //           assert(bots[0], 'Bot not found in WNS.');
  //           hash = get(bots, `[0].attributes.package.${platform.replace('-', '.')}["/"]`);
  //           break;
  //         }
  //         default: {
  //           throw new Error(`Invalid type "${thing}".`);
  //         }
  //       }
  //     }

  //     assert(hash, 'Invalid Hash.');

  //     const attributes = { type: RECORD_TYPE, service: SERVICE_TYPE };
  //     const services = await registry.queryRecords(attributes);

  //     const addresses = services.reduce((prev, service) => {
  //       const addrs = get(service, 'attributes.ipfs.addresses', []);
  //       return [...prev, ...addrs];
  //     }, []);

  //     // Find in IPFS.
  //     const data = spawnSync(IPFS_EXEC, ['--timeout', '10s', 'dht', 'findprovs', hash.trim()]);
  //     const found = String(data.stdout).split('\n');

  //     const result = found.filter(Boolean).map(hash => {
  //       const address = addresses.find(addr => addr.includes(hash));
  //       if (address) {
  //         return { node: address, registered: true };
  //       }
  //       return { node: hash, registered: false };
  //     });

  //     const wnsRegisteredCount = result.filter(({ registered }) => registered).length;

  //     const info = {
  //       ...(thing !== hash ? { name, type: thing } : {}),
  //       hash,
  //       'wns-registered-nodes-found': wnsRegisteredCount,
  //       'non-wns-registered-nodes-found': result.length - wnsRegisteredCount
  //     };

  //     if (json) {
  //       print({ ...info, result }, { json });
  //     } else {
  //       print(info, { json });
  //       print(result, { json });
  //     }
  //   })
  // })

  // Download a file.
  // .command({
  //   command: ['download [outdir]'],
  //   describe: 'Download File from IPFS.',
  //   builder: yargs => yargs
  //     .positional('outdir', { type: 'string', default: '.' })
  //     .option('quiet', { type: 'boolean', default: false })
  //     .option('name', { type: 'string', required: false })
  //     .option('id', { type: 'string', required: false })
  //     .option('timeout', { type: 'string', default: '20m' }),
  //   handler: asyncHandler(download(config))
  // })

    // Upload files.
    .command({
      command: ['upload <target>'],
      describe: 'Upload a file to IPFS.',
      builder: yargs => yargs
        .version(false)
        .positional('target', { type: 'string', required: true })
        .option('account', { type: 'string' })
        .option('quiet', { type: 'boolean', default: false, alias: 'q' })
        .option('name', { type: 'string' })
        .option('domain', { type: 'string' })
        .option('tag', { type: 'string' })
        .option('timeout', { type: 'string', default: '20m' }),
      handler: asyncHandler(async (argv: any) => {
        const client = await getDXNSClient();
        const account = await client.getDXNSAccount(argv);
        const result = await publish(config)(argv);
        await register({ getDXNSClient, account })({ ...argv, ...result });
      })
    })

    // Query files.
    .command({
      command: ['query'],
      describe: 'Query files.',
      builder: yargs => yargs,

      handler: asyncHandler(query({ getDXNSClient }))
    })

    .command({
      command: ['install'],
      describe: 'Install IPFS.',
      builder: yargs => yargs,

      handler: asyncHandler(install())
    })

    .command({
      command: ['init'],
      describe: 'Init IPFS.',
      builder: yargs => yargs,

      handler: asyncHandler(init())
    })

});
