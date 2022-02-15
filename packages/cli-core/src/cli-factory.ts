//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import yaml from 'js-yaml';
import readPkgUp from 'read-pkg-up';
import parse from 'yargs-parser';

import { Config } from '@dxos/config';

import { App } from './app';
import { getConfig, getActiveProfilePath } from './config';
import { loadCerts } from './util/certs';
import { getLoggers } from './util/log';
import { printMissingProfile } from './util/messages';

export const EXTENSION_CONFIG_FILENAME = 'extension.yml';

// Commands which are permitted to run without an active profile.
const COMMANDS_PERMIT_NO_PROFILE = [
  'help',
  'version',
  'keys',
  'profile',
  'services'
];

const { log, debugLog, logError } = getLoggers();

export interface ExtensionInfo {
  modules?: Array<any>,
  getModules?: Function,
  version: string,
  init?: Function,
  destroy?: Function,
  options?: any,
  state?: any,
}

export interface CLI {
  modules?: Array<any>,
  getModules?: Function,
  init?: Function,
  destroy?: Function,
  dir: string,
  main?: boolean,
  options?: any,
  info: any,
  compose?: string
}

/**
 * Provides command executor in form of CLI extension.
 * @param {ExtensionInfo} options
 */
const getRunnableExtension = (extension: ExtensionInfo) => {
  const { modules, getModules, version, options = {} } = extension;
  return async (state: any, argv: any) => {
    const app = new App({ modules, getModules, state, options, version });
    return app.start(argv);
  };
};

/**
 * Provides command executor in form of standalone CLI.
 * @param {ExtensionInfo} options
 */
const getRunnable = (extension: ExtensionInfo) => {
  const { modules, getModules, version, init, destroy, options = {} } = extension;
  return async () => {
    // Pipe warnings to logs.
    console.warn = debugLog;
    loadCerts();

    const argv = process.argv.slice(2);
    const { profile, help, dryRun } = parse(argv);
    const [command] = argv;
    const profilePath = getActiveProfilePath(profile) ?? undefined;
    const profileExists = profilePath ? fs.existsSync(profilePath) : false;

    if (!profileExists && !help && !COMMANDS_PERMIT_NO_PROFILE.includes(command)) {
      printMissingProfile();
      process.exit(1);
    }

    if (dryRun) {
      log(`Profile: ${profilePath}`);
    }

    // Load config if profile exists.
    // These defaults are required as during 'dx profile init', there is no config to load, and so no client can be created.
    const config: Config = profileExists ? (await getConfig(profilePath!)) : { get: () => ({}) } as any;

    const app = new App({ modules, getModules, config, options, version, profilePath, profileExists });

    try {
      if (init) {
        await init(app.state);
      }
      await app.start();
    } catch (err) {
      logError(err);
      process.exit(1);
    }

    if (destroy) {
      await destroy(app.state);
    }
  };
};

/**
 * Create new instance of CLI.
 * @param {CLI} options
 */
export const createCLI = (options: CLI) => {
  const { modules, getModules, init, destroy, dir, main, options: cliOptions, info, compose } = options;

  assert(dir);
  assert(info, `Invalid ${EXTENSION_CONFIG_FILENAME} file.`);

  const pkg = readPkgUp.sync({ cwd: dir });
  const version = `v${pkg!.package.version}`;

  const run = getRunnable({ modules, getModules, version, options: cliOptions, init, destroy });

  if (main) {
    // eslint-disable-next-line
    run();
    return;
  }

  const { command, ...restInfo } = yaml.load(info);
  // TODO(egorgripasov): Docker compose.
  const dockerCompose = compose ? yaml.load(compose) : undefined;

  return {
    run,
    runAsExtension: getRunnableExtension({ modules, getModules, version, options: cliOptions }),
    init,
    destroy,
    info: {
      command: command ? command.map((cmd: any) => typeof cmd === 'object' ? cmd.command : cmd) : undefined,
      ...restInfo,
      package: {
        name: pkg!.package.name,
        version: pkg!.package.version
      }
    },
    dockerCompose
  };
};
