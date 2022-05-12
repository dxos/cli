//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import get from 'lodash.get';
import { compare, valid } from 'semver';

import { TemplateHelper, asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { ExtensionManager, Pluggable, addInstalled } from '../extensions';

// TODO(burdon): Move to config.
const DEFAULT_TEMPLATE = 'https://github.com/dxos/templates/tree/main/cli-template';

/**
 * Extension CLI module.
 * @returns {object}
 */
export const ExtensionModule = ({ getReadlineInterface }) => ({
  command: ['extension'],
  describe: 'CLI extensions.',
  builder: yargs => yargs

    // List.
    .command({
      command: ['list'],
      describe: 'List installed CLI extensions.',
      builder: yargs => yargs,

      handler: asyncHandler(async argv => {
        const { json } = argv;
        const extensionManager = new ExtensionManager();
        let extensions = await extensionManager.list();
        extensions = extensions.map(({ moduleName, version, description, modules }) => ({
          extension: moduleName,
          modules,
          version,
          description
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
            const extensionManager = new ExtensionManager();
            await extensionManager.add(moduleName, info);
            return;
          }
        }

        const spinner = `Installing ${moduleName}${version ? `@${version}` : ''}`;
        await pluggable.installModule(npmClient, { spinner });

        const updatedInfo = pluggable.getInfo();
        const extensionManager = new ExtensionManager();
        await extensionManager.add(moduleName, updatedInfo);
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

        const extensionManager = new ExtensionManager();
        if (!pluggable.installed) {
          await extensionManager.remove(moduleName);
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
        await extensionManager.remove(moduleName);
      })
    })

    // Create an app from the template.
    .command({
      command: ['create [name]'],
      describe: 'Create extension from template.',
      builder: yargs => yargs
        .option('template', { default: DEFAULT_TEMPLATE })
        .option('path', { type: 'string' })
        .option('name', { type: 'string' })
        .option('force', { type: 'boolean' })
        .option('github-token', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { template, path, githubToken, name, force, 'dry-run': noop } = argv;

        if (noop) {
          return;
        }

        const rl = getReadlineInterface();

        const askUser = async question => new Promise(resolve => {
          rl.question(question, answer => {
            resolve(answer);
          });
        });

        if (force) {
          const answer = await askUser('All pervious data on destination folder would be lost - do you want to proceed? (yes/no): ');
          if (!answer.toString().toLowerCase().startsWith('y')) {
            return;
          }
        }
        rl.close();

        const created = await TemplateHelper.downloadTemplateFromRepo(template, githubToken, path || name, force);

        const basename = created.split('/').slice(-1)[0];
        log(`./${basename} <- ${template}`);
      })
    })
});
