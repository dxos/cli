//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import path from 'path';
import readPkgUp from 'read-pkg-up';

import { log } from '@dxos/debug';
import { asyncHandler } from '@dxos/cli-core';

import { addInstalled, removeInstalled, listInstalled } from '../extensions';
import { Pluggable } from '../pluggable';

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

/**
 * Uninstall CLI module.
 * @returns {object}
 */
export const UninstallModule = () => ({
  command: ['uninstall'],
  describe: 'Uninstall dxos cli and extensions.',
  builder: yargs => yargs
    .version(false)
    .option('npm-client'),
  handler: asyncHandler(async argv => {
    const { npmClient } = argv;

    const extensions = await listInstalled();

    // Remove extensions.
    if (extensions.length) {
      log(`Found extensions: ${extensions.map(({ moduleName }) => moduleName).join(', ')}`);
      const pluggableModules = extensions.map(module => new Pluggable(module));
      for await (const pluggableModule of pluggableModules) {
        const spinner = `Uninstalling ${pluggableModule.moduleName}`;
        await pluggableModule.uninstallModule(npmClient, { spinner });
        await removeInstalled(pluggableModule.moduleName);
      }
    }

    // Remove main cli.
    const cli = new Pluggable({ moduleName: pkg.package.name });
    const spinner = `Uninstalling ${cli.moduleName}`;
    await cli.uninstallModule(npmClient, { spinner });
  })
});

/**
 * Upgrade CLI module.
 * @returns {object}
 */
export const UpgradeModule = ({ config }) => ({
  command: ['upgrade'],
  describe: 'Upgrade CLI.',

  builder: yargs => yargs
    .version(false)
    .option('npm-client')
    .option('channel', { default: config.get('cli.channel') })
    .option('force', { type: 'boolean', default: false })
    .option('version'),

  handler: asyncHandler(async argv => {
    const { channel, version, force, npmClient } = argv;

    const newVersion = version || channel;
    assert(newVersion, 'Invalid Version.');

    const extensions = await listInstalled();
    let modules = [];

    if (force) {
      if (extensions.length) {
        log(`Found extensions: ${extensions.map(({ moduleName }) => moduleName).join(', ')}`);
        modules = extensions.map(({ moduleName }) => new Pluggable({ moduleName, version: newVersion }));
      }
      modules.push(new Pluggable({ moduleName: pkg.package.name, version: newVersion }));
    }

    // Remove old modules.
    for await (const module of modules) {
      const spinner = `Uninstalling ${module.moduleName}`;
      await module.uninstallModule(npmClient, { spinner });
      await removeInstalled(module.moduleName);
    }

    // Install new modules.
    for await (const module of modules.reverse()) {
      const spinner = `Installing ${module.moduleName}`;
      await module.installModule(npmClient, { spinner });
      if (module.moduleName !== pkg.package.name) {
        await addInstalled(module.moduleName, module.getInfo());
      }
    }
  })
});
