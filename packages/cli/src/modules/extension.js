//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import get from 'lodash.get';
import { compare, valid } from 'semver';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { Pluggable } from '../pluggable';
import { addInstalled, removeInstalled, listInstalled } from '../extensions';

/**
 * Extension CLI module.
 * @returns {object}
 */
export const ExtensionModule = ({ getReadlineInterface }) => ({
  command: ['extension'],
  describe: 'CLI Extensions.',

  builder: yargs => yargs

    // List.
    .command({
      command: ['list'],
      describe: 'List installed CLI extensions.',
      builder: yargs => yargs,

      handler: asyncHandler(async argv => {
        const { json } = argv;
        let extensions = await listInstalled();
        extensions = extensions.map(({ moduleName, version, describe, command }) => ({
          extension: moduleName,
          command,
          version,
          description: describe
        }));

        print(extensions, { json });
      })
    })

  // TODO(burdon): Find extensions via registry.
  // Query.
  // .command({
  //   command: ['query'],
  //   describe: 'Query registry for CLI extensions',
  //   builder: yargs => yargs.option('url'),
  //   handler: asyncHandler(async argv => {})
  // })

    // Install.
    .command({
      command: ['install <module>', 'upgrade <module>'],
      describe: 'Install CLI extensions',
      builder: yargs => yargs
        .option('module')
        .option('version')
        .option('npm-client'),

      handler: asyncHandler(async argv => {
        const { module: moduleName, version, npmClient } = argv;
        assert(moduleName, 'Invalid extension.');

        const pluggable = new Pluggable({ moduleName, version });
        if (pluggable.isInWorkspace) {
          log(`Local version of "${moduleName}" from workspace is used, aborting.`);
          return;
        }
        if (pluggable.installed) {
          const info = pluggable.getInfo();
          const installedVersion = get(info, 'package.version');

          let action = 'upgrade';

          // TODO(egorgripasov): Read verison number from WNS.
          if (version && valid(version) && installedVersion) {
            const comp = compare(version, installedVersion);
            switch (comp) {
              case -1: {
                action = 'downgrade';
                break;
              }
              case 0: {
                action = 'reinstall';
                break;
              }
              default: {
                break;
              }
            }
          }

          const rl = getReadlineInterface();
          const wishToUpgrade = await new Promise(resolve => {
            rl.question(`Extension ${moduleName}${installedVersion ? `@${installedVersion}` : ''} already installed, do you wish to ${action}? (Yes/No): `, answer => {
              resolve(answer);
            });
          });
          rl.close();

          if (!(/^y/i.test(wishToUpgrade))) {
            log('Abotring.');
            await addInstalled(moduleName, info);
            return;
          }
        }

        const spinner = `Installing ${moduleName}${version ? `@${version}` : ''}`;
        await pluggable.installModule(npmClient, { spinner });

        const updatedInfo = pluggable.getInfo();
        await addInstalled(moduleName, updatedInfo);
      })
    })

    // Uninstall.
    .command({
      command: ['uninstall <module>'],
      describe: 'Uninstall CLI extension',
      builder: yargs => yargs
        .option('module')
        .option('npm-client'),

      handler: asyncHandler(async argv => {
        const { module: moduleName, npmClient } = argv;

        assert(moduleName, 'Invalid extension.');

        const pluggable = new Pluggable({ moduleName });
        if (pluggable.isInWorkspace) {
          log(`Local version of "${moduleName}" from workspace is used, aborting.`);
          return;
        }

        if (!pluggable.installed) {
          await removeInstalled(moduleName);
          return;
        }

        const info = pluggable.getInfo();
        const installedVersion = get(info, 'package.version');

        const rl = getReadlineInterface();
        const wishToProceed = await new Promise(resolve => {
          rl.question(`Found Extension ${moduleName}${installedVersion ? `@${installedVersion}` : ''} installed, do you wish to remove it? (Yes/No): `, answer => {
            resolve(answer);
          });
        });
        rl.close();

        if (!(/^y/i.test(wishToProceed))) {
          log('Abotring.');
          return;
        }

        const spinner = `Uninstalling ${moduleName}`;
        await pluggable.uninstallModule(npmClient, { spinner });

        await removeInstalled(moduleName);
      })
    })
});
