//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';

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
  printProfileNotFound
} from '@dxos/cli-core';

/**
 * Profile CLI module.
 * @returns {object}
 */
export const ProfileModule = () => ({
  command: ['profile'],
  describe: 'CLI profile management.',

  builder: yargs => yargs
    .command({
      command: ['init'],
      describe: 'Init profile.',
      builder: yargs => yargs
        .option('name', { type: 'string', describe: 'Profile name' })
        .option('template-url', { type: 'string', describe: 'URL to download profile template' }),

      handler: asyncHandler(async argv => {
        const { name, templateUrl } = argv;

        assert(name, 'Invalid profile name.');
        assert(templateUrl, 'Invalid template URL.');

        return initProfileFromTemplate(name, templateUrl);
      })
    })

    .command({
      command: ['set [name]'],
      describe: 'Set profile as default.',

      handler: asyncHandler(async argv => {
        const { name } = argv;

        assert(name, 'Invalid profile name.');

        const profilePath = getProfilePath(name);
        if (!fs.existsSync(profilePath)) {
          printProfileNotFound(profilePath)
          return;
        }

        await setProfileAsDefault(name);
      })
    })

    .command({
      command: ['config [profile]'],
      describe: 'Profile config.',

      handler: asyncHandler(async argv => {
        const { profile } = argv;

        const profilePath = (profile ? getProfilePath(profile) : getActiveProfilePath());
        if (!fs.existsSync(profilePath)) {
          printProfileNotFound(profilePath)
          return;
        }

        print(getConfig(profilePath).values, { json: true });
      })
    }),

  handler: asyncHandler(async () => {
    const profilePath = getActiveProfilePath();
    if (!profilePath) {
      printMissingProfile();
      return;
    }

    if (!fs.existsSync(profilePath)) {
      printProfileNotFound(profilePath)
      return;
    }

    print(getProfileName(profilePath));
  })
});
