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
import { CLI, EXTENSION_CONFIG_FILENAME, ExtensionInfo } from './types';
import { getLoggers, loadCerts, printMissingProfile } from './utils';

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
 */
// TODO(burdon): Return type.
export const createCLI = ({
  modules,
  getModules,
  init,
  destroy,
  dir,
  main,
  options,
  info,
  compose
}: CLI) => {
  assert(info, `Invalid ${EXTENSION_CONFIG_FILENAME} file.`);
  assert(dir);

  const pkg = readPkgUp.sync({ cwd: dir });
  const version = `v${pkg!.package.version}`;

  const run = getRunnable({ modules, getModules, version, options, init, destroy });
  if (main) {
    void run();
    return;
  }

  // dx.yml file.
  const { modules: commandModules, ...restInfo } = yaml.load(info);

  // TODO(egorgripasov): Docker compose.
  const dockerCompose = compose ? yaml.load(compose) : undefined;

  // TODO(burdon): Change to class?
  return {
    info: {
      ...restInfo,
      command: commandModules ? commandModules.map((module: any) => module.command) : undefined, // TODO(burdon): Type?
      package: {
        name: pkg!.package.name,
        version: pkg!.package.version
      }
    },
    run,
    runAsExtension: getRunnableExtension({ modules, getModules, version, options }),
    init,
    destroy,
    dockerCompose
  };
};
