//
// Copyright 2020 DXOS.org
//

import { spawn } from 'child_process';

import { Runnable, stopService, asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

const MDNS_PROCESS_NAME = 'mdns';
const DEFAULT_LOG_FILE = '/var/log/mdns.log';

/**
 * MDNS CLI module.
 */
export const MDNSModule = ({ config }) => {
  const bin = config.get('runtime.cli.mdns.bin');

  const mdnsRunnable = new Runnable(bin, []);

  return ({
    command: ['mdns'],
    describe: 'MDNS CLI.',
    builder: yargs => yargs

      // Install / Upgrade.
      .command({
        command: ['install', 'upgrade'],
        describe: 'Download & Install MDNS.',
        builder: yargs => yargs.version(false)
          .option('npmClient', { default: config.get('runtime.cli.npmClient') })
          .option('dry-run', { type: 'boolean', default: false })
          .option('channel', { default: config.get('runtime.cli.mdns.channel') })
          .option('version'),
        handler: asyncHandler(async ({ npmClient, channel, version, 'dry-run': noop }) => {
          const npmPkg = config.get('runtime.cli.mdns.package');
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

      // start.
      .command({
        command: ['start [params...]'],
        describe: 'Start MDNS',
        builder: yargs => yargs
          .strict(false)
          .help(false)
          .option('help')
          .option('log-file', { type: 'string' })
          .option('proc-name', { type: 'string', default: MDNS_PROCESS_NAME })
          .option('config')
          .option('daemon'),
        handler: asyncHandler(async ({ config, daemon, logFile = DEFAULT_LOG_FILE, procName, ...argv }) => {
          // Convert argv params into args array excepting those from yargs
          const args = Object.entries(argv).filter(([, v]) => Boolean(v)).reduce((prev, [key, value]) => {
            if (value !== false && !['$0', '_', 'proc-name'].includes(key)) {
              return [...prev, ...[`--${key}`, value !== true ? value : undefined].filter(Boolean)];
            }
            return prev;
          }, []);

          if (argv.help) {
            // usage and pass --help to underlying binary.
            yargs.showHelp();
          }

          const options = {
            name: procName,
            logFile,
            detached: daemon,
            env: {
              CONFIG_FILE: config,
              ...process.env
            }
          };

          // forward params to the binary
          void mdnsRunnable.run(args, options);
        })
      })

      // stop.
      .command({
        command: ['stop'],
        describe: 'Stop MDNS',
        builder: yargs => yargs
          .option('proc-name', { type: 'string', default: MDNS_PROCESS_NAME }),
        handler: asyncHandler(async ({ procName }) => {
          await stopService(procName);
        })
      })
  });
};
