//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import { Argv } from 'yargs';

import {
  asyncHandler,
  print,
  getActiveProfilePath,
  setProfileAsDefault,
  initProfileFromTemplate,
  getConfig,
  getProfilePath,
  getProfileName,
  printMissingProfile,
  printProfileNotFound,
  listClientProfileConfigs
} from '@dxos/cli-core';

/**
 * Profile CLI module.
 */
export const ProfileModule = () => ({
  command: ['profile'],
  describe: 'CLI profile management.',

  builder: (yargs: Argv) => yargs
    .command({
      command: ['init'],
      describe: 'Init profile.',
      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name' })
        .option('template-url', { type: 'string', describe: 'URL to download profile template' }),

      handler: asyncHandler(async (argv: any) => {
        const { name, templateUrl } = argv;

        assert(name, 'Invalid profile name.');
        assert(templateUrl, 'Invalid template URL.');

        return initProfileFromTemplate(name, templateUrl);
      })
    })

    .command({
      command: ['list'],
      describe: 'List CLI profiles.',

      builder: yargs => yargs,

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;
        print(listClientProfileConfigs(), { json });
      })
    })

    .command({
      command: ['set [name]'],
      describe: 'Set profile as default.',

      handler: asyncHandler(async (argv: any) => {
        const { name } = argv;

        assert(name, 'Invalid profile name.');

        const profilePath = getProfilePath(name);
        if (!fs.existsSync(profilePath)) {
          printProfileNotFound(profilePath);
          return;
        }

        await setProfileAsDefault(name);
      })
    })

    .command({
      command: ['config [profile]'],
      describe: 'Print profile config.',

      handler: asyncHandler(async (argv: any) => {
        const { profile } = argv;

        const profilePath = (profile ? getProfilePath(profile) : getActiveProfilePath());
        if (!fs.existsSync(profilePath!)) {
          printProfileNotFound(profilePath!);
          return;
        }

        print(getConfig(profilePath!).values, { json: true });
      })
    }),

  handler: asyncHandler(async () => {
    const profilePath = getActiveProfilePath();
    if (!profilePath) {
      printMissingProfile();
      return;
    }

    if (!fs.existsSync(profilePath)) {
      printProfileNotFound(profilePath);
      return;
    }

    print(getProfileName(profilePath));
  })
});
