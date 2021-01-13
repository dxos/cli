//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import parse from 'yargs-parser';
import readPkgUp from 'read-pkg-up';
import yaml from 'js-yaml';

import { App } from './app';
import { getConfig, getActiveProfilePath } from './config';
import { getLoggers } from './util/log';
import { loadCerts } from './util/certs';

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

/**
 * Provides command executor in form of CLI extension.
 * @param {Object} options
 */
const getRunnableExtension = ({ modules, getModules, version, options = {} }) => {
  return async (state, argv) => {
    const app = new App({ modules, getModules, state, options, version });
    return app.start(argv);
  };
};

/**
 * Provides command executor in form of standalone CLI.
 * @param {Object} options
 */
const getRunnable = ({ modules, getModules, version, init, destroy, options = {} }) => {
  return async () => {
    // Pipe warnings to logs.
    console.warn = debugLog;
    loadCerts();

    const argv = process.argv.slice(2);
    const { profile, help, dryRun } = parse(argv);
    const [command] = argv;
    const profilePath = getActiveProfilePath(profile);
    const profileExists = fs.existsSync(profilePath);

    if (!profileExists && !help && !COMMANDS_PERMIT_NO_PROFILE.includes(command)) {
      log('No active profile. Enter the following command to set the active profile:');
      log('dx profile set <NAME>');
      process.exit(1);
    }

    if (dryRun) {
      log(`Profile: ${profilePath}`);
    }

    // These defaults are required as during 'dx profile init', there is no config to load, and so no client can be created.
    let config = { get: () => ({}) };

    // Load config if profile exists.
    if (profileExists) {
      config = await getConfig(profilePath);
    }

    const app = new App({ modules, getModules, config, options, version, profilePath });

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
 * @param {{ init:function, destroy: function, dir: string, main: boolean, modules: array, getModules: function, options: object }} options
 */
export const createCLI = (options = {}) => {
  const { modules, getModules, init, destroy, dir, main, options: cliOptions, info } = options;

  assert(dir);
  assert(info, `Invalid ${EXTENSION_CONFIG_FILENAME} file.`);

  const pkg = readPkgUp.sync({ cwd: dir });
  const version = `v${pkg.package.version}`;

  const run = getRunnable({ modules, getModules, version, options: cliOptions, init, destroy });

  if (main) {
    run();
    return;
  }

  const { command, ...restInfo } = yaml.load(info);

  return {
    run,
    runAsExtension: getRunnableExtension({ modules, getModules, version, options: cliOptions }),
    init,
    destroy,
    info: {
      command: command ? command.map(cmd => typeof cmd === 'object' ? cmd.command : cmd) : undefined,
      ...restInfo,
      package: {
        name: pkg.package.name,
        version: pkg.package.version
      }
    }
  };
};
