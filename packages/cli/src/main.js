//
// Copyright 2020 DXOS.org
//

import yaml from 'js-yaml';
import uniqBy from 'lodash.uniqby';
import readPkgUp from 'read-pkg-up';

import { getLoggers, createCLI } from '@dxos/cli-core';

import KNOWN_EXTENSIONS from '../known-extensions.yml';
import { listInstalled } from './extensions';
import { CertModule } from './modules/cert';
import { ExtensionModule } from './modules/extension';
import { UpgradeModule, UninstallModule } from './modules/installation';
import { PluggableModule } from './modules/pluggable';
import { ProfileModule } from './modules/profile';
import { ServicesModule } from './modules/services';

const { logError } = getLoggers();

const knownExtensions = yaml.load(KNOWN_EXTENSIONS);

const pkg = readPkgUp.sync({ cwd: __dirname });

const WIRE_CLI_BASE_COMMAND = 'dx';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const extensions = [];
const destroyers = [];

const init = async (state) => {
  const installedExtensions = await listInstalled();
  const pluggableModules = uniqBy(knownExtensions.concat(installedExtensions), 'moduleName');

  for await (const extension of pluggableModules) {
    const version = extension.version || pkg.package.version;
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
  CertModule,
  ServicesModule,
  UpgradeModule,
  UninstallModule,
  ExtensionModule
];

module.exports = createCLI({
  options: WIRE_CONFIG,
  dir: __dirname,
  main: !module.parent,
  init,
  destroy,
  getModules: async () => [...modules, ...extensions],
  info: {}
});

const handleError = err => {
  logError(err);
  process.exit(1);
};

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);
