//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import readPkgUp from 'read-pkg-up';
import parse from 'yargs-parser';

import { Config } from '@dxos/config';

import { App } from './app';
import { getConfig, getActiveProfilePath } from './config';
import { CoreState, EXTENSION_CONFIG_FILENAME, ExtensionInfo, Extension } from './types';
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
 */
const getRunnableExtension = (extension: ExtensionInfo) => {
  const { modules, getModules, version, options = {} } = extension;
  return async (state: CoreState, argv: any) => {
    const app = new App({ modules, getModules, state, options, version });
    return app.start(argv);
  };
};

/**
 * Provides command executor in form of standalone CLI.
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

    // Create app.
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

export interface CLIOptions {
  dir: string
  main?: boolean
  modules?: any[]
  getModules?: Function
  init?: Function
  destroy?: Function
  onExit?: Function
  info: Extension
  docker?: any
  options?: any
}

export type CLIObject = {
  info: Extension
  run: () => Promise<void> // TODO(burdon): Rename runnable.
  runAsExtension: (state: CoreState, argv: any) => Promise<void>
  init?: Function
  destroy?: Function
  onExit?: Function
  docker?: any
}

/**
 * Create new instance of CLI.
 */
export const createCLI = ({
  dir,
  modules,
  getModules,
  init,
  destroy,
  onExit,
  main,
  options,
  info,
  docker
}: CLIOptions): CLIObject | undefined => {
  assert(info, `Invalid ${EXTENSION_CONFIG_FILENAME} file.`);
  assert(dir);

  const pkg = readPkgUp.sync({ cwd: dir });

  info.version = pkg!.package.version;
  const version = `v${pkg!.package.version}`;

  const runnable = getRunnable({ modules, getModules, version, options, init, destroy });
  if (main) {
    void runnable();
    return;
  }

  return {
    info,
    run: runnable,
    runAsExtension: getRunnableExtension({ modules, getModules, version, options }),
    init,
    destroy,
    onExit,
    docker
  };
};
