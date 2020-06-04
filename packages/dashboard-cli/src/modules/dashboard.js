//
// Copyright 2020 DxOS.
//
import { spawn } from 'child_process';
import { Runnable, stopService, asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

const DASHBOARD_PROCESS_NAME = 'dashboard';
const DEFAULT_LOG_FILE = '/var/log/dashboard.log';

/**
 * App CLI module.
 */
export const AppModule = ({ config }) => {
  const bin = config.get('cli.dashboard.bin');

  const dashboardRunnable = new Runnable(bin, []);

  return ({
    command: ['dashboard', 'dash'],
    describe: 'Dashboard CLI.',
    builder: yargs => yargs

      // Install / Upgrade.
      .command({
        command: ['install', 'upgrade'],
        describe: 'Download & Install Dashboard bundle.',
        builder: yargs => yargs.version(false)
          .option('npmClient', { default: config.get('cli.npmClient') })
          .option('dry-run', { type: 'boolean', default: false })
          .option('channel', { default: config.get('cli.dashboard.channel') })
          .option('version'),
        handler: asyncHandler(async ({ npmClient, channel, version, 'dry-run': noop }) => {
          const npmPkg = config.get('cli.dashboard.package');
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
        describe: 'Start Dashboard',
        builder: yargs => yargs
          .strict(false)
          .help(false)
          .option('help')
          .option('log-file', { type: 'string' })
          .option('proc-name', { type: 'string', default: DASHBOARD_PROCESS_NAME })
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
          dashboardRunnable.run(args, options);
        })
      })

      // stop.
      .command({
        command: ['stop'],
        describe: 'Stop Dashboard',
        builder: yargs => yargs
          .option('proc-name', { type: 'string', default: DASHBOARD_PROCESS_NAME }),
        handler: asyncHandler(async ({ procName }) => {
          await stopService(procName);
        })
      })
  });
};
