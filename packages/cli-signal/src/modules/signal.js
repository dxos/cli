//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import { spawn } from 'child_process';

import { Runnable, sanitizeEnv, stopService, asyncHandler } from '@dxos/cli-core';
import { Registry } from '@dxos/registry-client';
import { log } from '@dxos/debug';

const SIGNAL_PROCESS_NAME = 'signal';
const DEFAULT_LOG_FILE = '/var/log/signal.log';

const LIMIT = 5;
const RECORD_TYPE = 'dxn:service';
const SERVICE_TYPE = 'signal';

/**
 * Signal CLI module.
 */
export const SignalModule = ({ config }) => {
  const bin = config.get('cli.signal.bin');

  const signalRunnable = new Runnable(bin, []);

  return {
    command: ['signal'],
    describe: 'Signal CLI.',
    builder: yargs => yargs
      // Install / Upgrade.
      .command({
        command: ['install', 'upgrade'],
        describe: 'Download & Install @dxos/signal binary.',
        builder: yargs => yargs.version(false)
          .option('npmClient', { default: config.get('cli.npmClient') })
          .option('dry-run', { type: 'boolean', default: false })
          .option('channel', { default: config.get('cli.signal.channel') })
          .option('version'),
        handler: asyncHandler(async ({ npmClient, channel, version, 'dry-run': noop }) => {
          const npmPkg = config.get('cli.signal.package');
          const packageVersion = `${npmPkg}@${version || channel}`;
          const args = npmClient === 'npm' ? ['install', '-g'] : ['global', 'add'];
          args.push(packageVersion);
          const options = {
            stdio: 'inherit',
            env: { ...process.env }
          };
          log(`Installing ${packageVersion}...`);
          log(`${[npmClient, ...args].join(' ')}`);

          if (!noop) {
            spawn(npmClient, args, options);
          }
        })
      })

      .command({
        command: ['start'],
        describe: 'Start signal.',
        builder: yargs => yargs
          .strict(false)
          .help(false)
          .option('help')
          .option('registry-bootstrap', {
            describe: 'start with registry bootstrap',
            type: 'boolean',
            default: true
          })
          .option('log-file', { type: 'string' })
          .option('proc-name', { type: 'string', default: SIGNAL_PROCESS_NAME })
          .option('daemon')
          .option('max-memory', { type: 'string' }),

        handler: asyncHandler(async ({
          daemon,
          maxMemory,
          logFile = DEFAULT_LOG_FILE,
          procName,
          verbose,
          registryBootstrap,
          ...argv
        }) => {
          if (registryBootstrap && !argv.help) {
            const { server, chainId } = config.get('services.registry');

            assert(server, 'Invalid Registry endpoint.');
            assert(chainId, 'Invalid Registry Chain ID.');

            const registry = new Registry(server, chainId);
            const attributes = clean({ type: RECORD_TYPE, service: SERVICE_TYPE });
            const registeredServers = await registry.queryRecords(attributes);

            const bootstrap = registeredServers
              .filter(({ attributes: { signal: { active, bootstrap } } }) => active !== false && bootstrap)
              .map(({ attributes: { signal: { bootstrap } } }) => bootstrap)
              .sort(() => Math.random() - 0.5)
              .slice(0, LIMIT)
              .join(',');

            argv.bootstrap = argv.bootstrap ? `${argv.bootstrap},${bootstrap}` : bootstrap;
          }

          if (verbose) {
            argv.logLevel = 'debug';
          }

          if (daemon) {
            argv.logFormat = 'json';
          }

          // Convert argv params into args array excepting those from yargs
          let args = Object.entries(argv).filter(([k, v]) => !k.includes('-') && Boolean(v)).reduce((prev, [key, value]) => {
            if (value !== false && !['$0', '_', 'proc-name'].includes(key)) {
              return [...prev, ...[`--${key}`, value !== true ? value : undefined].filter(Boolean)];
            }
            return prev;
          }, []);

          if (argv.help) {
            args = ['--help'];
            // usage and pass --help to underlying binary.
            yargs.showHelp();
          }

          const options = {
            name: procName,
            logFile,
            detached: daemon,
            maxMemory,
            env: {
              CONFIG_FILE: config,
              ...sanitizeEnv(process.env)
            }
          };

          // forward params to the binary
          signalRunnable.run(args, options);
        })
      })

      // stop.
      .command({
        command: ['stop'],
        describe: 'Stop Signal',
        builder: yargs => yargs
          .option('proc-name', { type: 'string', default: SIGNAL_PROCESS_NAME }),
        handler: asyncHandler(async ({ procName }) => {
          await stopService(procName);
        })
      })
  };
};
