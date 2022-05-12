//
// Copyright 2020 DXOS.org
//

import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import uniqBy from 'lodash.uniqby';
import path from 'path';

import { getLoggers, createCLI, CoreState, Extension } from '@dxos/cli-core';

import { listInstalled } from './extensions';
import {
  DevtoolsModule,
  ExtensionModule,
  HaloModule,
  InfoModule,
  PluggableModule,
  ProfileModule,
  ServicesModule,
  StorageModule,
  UninstallModule,
  UpgradeModule
} from './modules';

const CLI_BASE_COMMAND = 'dx';

const EXTENSION_FILE = 'dx.yml';

const { logError } = getLoggers();

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const modules = [
  InfoModule,
  ProfileModule,
  DevtoolsModule,
  ServicesModule,
  StorageModule,
  HaloModule,
  UpgradeModule,
  UninstallModule,
  ExtensionModule
];

const pluggableModules: PluggableModule[] = [];

const init = async (state: CoreState) => {
  // Generated by package script from Yargs definitions.
  const extensionDefs = readFileSync(path.join(__dirname, '../known-extensions.yml')).toString();
  const knownExtensions: Extension[] = yaml.load(extensionDefs);

  // If developing new extension - read info from cwd.
  const localExtensionFile = path.join(process.cwd(), EXTENSION_FILE);
  if (existsSync(localExtensionFile)) {
    // Load DXNS YML file.
    const devExtension = readFileSync(localExtensionFile).toString();
    const devExtensionInfo = yaml.load(devExtension);
    const { name, version, description, modules } = devExtensionInfo;

    knownExtensions.push({
      moduleName: `@${name}`, // TODO(burdon): Just keep name and convert where needed via util?
      version,
      description,
      modules
    });
  }

  const installedExtensions: Extension[] = await listInstalled();
  const pluggableExtensions: Extension[] = uniqBy(knownExtensions.concat(installedExtensions), 'moduleName');
  for await (const pluggableExtension of pluggableExtensions) {
    const pluggableModule = new PluggableModule(pluggableExtension, state);
    await pluggableModule.init();
    pluggableModules.push(pluggableModule);

    const exportedModules = pluggableModule.export();
    modules.push(...exportedModules);
  }
};

const destroy = async () => {
  for await (const pluggableModule of pluggableModules) {
    await pluggableModule.destroy();
  }
};

const handleError = (err: any) => {
  logError(err);
  process.exit(1);
};

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  info: {},
  init, // TODO(burdon): This has side-effects. Better to get modules from calling this method?
  destroy,
  getModules: async () => modules,
  options: CLI_CONFIG
});
