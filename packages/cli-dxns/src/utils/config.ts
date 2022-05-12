//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import fs from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import mapvalues from 'lodash.mapvalues';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import path from 'path';

import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile } from '@dxos/cli-core';
import { Config } from '@dxos/config';
import type { ConfigObject } from '@dxos/config';

export type PackageModule = NonNullable<NonNullable<ConfigObject['package']>['modules']>[0];
export type PackageRepo = NonNullable<NonNullable<ConfigObject['package']>['repos']>[0];

export const CONFIG_FILENAME = 'dx.yml';

const DEFAULT_BUILD_COMMAND = 'npm run build';

const REPO_GIT = 'git';

const IGNORED_CONFIG_ATTRIBUTES = ['version'];

export const loadConfig = async (configPath: string = CONFIG_FILENAME): Promise<Config> => {
  // Props from package.json.
  const packageProps = mapvalues(pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME)
    : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES), (value: any) => value?.url ? value.url : value);

  // dx.yml.
  assert(fs.existsSync(configPath), `"${configPath}" not found.`);
  const dxConfig = omit(await readFile(configPath, { absolute: path.isAbsolute(configPath) }), IGNORED_CONFIG_ATTRIBUTES) as ConfigObject;

  assert(dxConfig.package?.modules?.length, `No modules found in ${configPath}`);

  // Repo.
  const repos: PackageRepo[] = [];
  if (packageProps.repository) {
    const { status, stdout } = spawnSync('git', [
      'describe',
      '--tags',
      '--first-parent',
      '--abbrev=99',
      '--long',
      '--dirty',
      '--always'
    ], { shell: true });
    repos.push({ type: REPO_GIT, repo: packageProps.repository, version: status === 0 ? stdout.toString().trim() : undefined } as PackageRepo);
  }

  return new Config(
    {
      version: 1,
      package: {
        license: dxConfig.package.license ?? packageProps.license,
        repos,
        modules: dxConfig.package.modules.map((module: PackageModule) => defaultsDeep(module, {
          tags: packageProps.keywords ?? [],
          description: packageProps.description,
          build: { command: DEFAULT_BUILD_COMMAND },
          repos: module.repos ?? repos
        }))
      }
    }
  );
};
