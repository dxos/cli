//
// Copyright 2020 DXOS.org
//

import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import uniqBy from 'lodash.uniqby';
import path from 'path';
import readPkgUp from 'read-pkg-up';

import { getLoggers, createCLI, CoreState } from '@dxos/cli-core';

import { listInstalled } from './extensions';
import { CertModule } from './modules/cert';
import { DevToolsModule } from './modules/devtools';
import { ExtensionModule } from './modules/extension';
import { HaloModule } from './modules/halo';
import { UpgradeModule, UninstallModule } from './modules/installation';
import { PluggableModule } from './modules/pluggable';
import { ProfileModule } from './modules/profile';
import { ServicesModule } from './modules/services';
import { StorageModule } from './modules/storage';

const KNOWN_EXTENSIONS = readFileSync(path.join(__dirname, '../known-extensions.yml')).toString();

const { logError } = getLoggers();

const knownExtensions = yaml.load(KNOWN_EXTENSIONS);

const pkg = readPkgUp.sync({ cwd: __dirname });

const CLI_BASE_COMMAND = 'dx';

const EXTENSION_INFO_FILE = 'extension.yml';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const extensions: any[] = [];
const destroyers: any[] = [];

const init = async (state: CoreState) => {
  const installedExtensions = await listInstalled();

  // If developing new extension - read info from cwd.
  const localExtensionFile = path.join(process.cwd(), EXTENSION_INFO_FILE);
  if (existsSync(localExtensionFile)) {
    const devExtension = (readFileSync(localExtensionFile)).toString();
    const devExtensionInfo = yaml.load(devExtension);

    const { name, description, command, initRequired, destroyRequired } = devExtensionInfo;

    knownExtensions.push({
      moduleName: `@${name}`,
      describe: description,
      command,
      initRequired,
      destroyRequired
    });
  }

  const pluggableModules = uniqBy(knownExtensions.concat(installedExtensions), 'moduleName');

  for await (const extension of pluggableModules) {
    const version = extension.version || pkg?.package.version;
    const pluggableModule = new PluggableModule({ ...extension, version }, state);
    if (extension.initRequired) {
      await pluggableModule.init();
    }

    // eslint-disable-next-line
    extensions.push(...pluggableModule.export.call(pluggableModule));

    if (extension.destroyRequired) {
      destroyers.push(pluggableModule.destroy.bind(pluggableModule));
    }
  }
};

const destroy = async () => {
  for await (const destroyer of destroyers) {
    await destroyer();
  }
};

const modules = [
  ProfileModule,
  DevToolsModule,
  CertModule,
  ServicesModule,
  StorageModule,
  HaloModule,
  UpgradeModule,
  UninstallModule,
  ExtensionModule
];

module.exports = createCLI({
  options: CLI_CONFIG,
  dir: __dirname,
  main: !module.parent,
  init,
  destroy,
  getModules: async () => [...modules, ...extensions],
  info: {}
});

const handleError = (err: any) => {
  logError(err);
  process.exit(1);
};

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);
