//
// Copyright 2020 DxOS.
//
import { spawn } from 'child_process';
import { Runnable, stopService, asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

const CONSOLE_PROCESS_NAME = 'console';
const DEFAULT_LOG_FILE = '/var/log/console.log';

/**
 * App CLI module.
 */
export const AppModule = ({ config }) => {
  const bin = config.get('cli.console.bin');

  const consoleRunnable = new Runnable(bin, []);

  return ({
    command: ['console', 'dash'],
    describe: 'Console CLI.',
    builder: yargs => yargs

      // Install / Upgrade.
      .command({
        command: ['install', 'upgrade'],
        describe: 'Download & Install Console packages',
        builder: yargs => yargs.version(false)
          .option('npmClient', { default: config.get('cli.npmClient') })
          .option('dry-run', { type: 'boolean', default: false })
          .option('channel', { default: config.get('cli.console.channel') })
          .option('version'),
        handler: asyncHandler(async ({ npmClient, channel, version, 'dry-run': noop }) => {
          const npmPkg = config.get('cli.console.package');
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
        describe: 'Start Console',
        builder: yargs => yargs
          .strict(false)
          .help(false)
          .option('help')
          .option('log-file', { type: 'string' })
          .option('proc-name', { type: 'string', default: CONSOLE_PROCESS_NAME })
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
          consoleRunnable.run(args, options);
        })
      })

      // stop.
      .command({
        command: ['stop'],
        describe: 'Stop Console',
        builder: yargs => yargs
          .option('proc-name', { type: 'string', default: CONSOLE_PROCESS_NAME }),
        handler: asyncHandler(async ({ procName }) => {
          await stopService(procName);
        })
      })
  });
};
