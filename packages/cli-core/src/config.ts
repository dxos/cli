//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import download from 'download';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import os from 'os';
import path from 'path';

import { Config, mapFromKeyValues, mapToKeyValues } from '@dxos/config';
import { createId } from '@dxos/crypto';

import envmap from './env-map.json';

// TODO(burdon): Change to ~/.dxos
export const PROFILE_ROOT = '.wire/profile';

// Default profile, ALWAYS a symlink.
export const DEFAULT_PROFILE_SYMLINK = 'default';

export const PACKAGE_JSON_FILENAME = 'package.json';
export const DEFAULT_PACKAGE_JSON_ATTRIBUTES = [
  'name', 'version', 'author', 'license', 'description', 'keywords', 'homepage', 'repository', 'bugs'
];

export const getProfilePath = (profile: string) => {
  return path.join(os.homedir(), PROFILE_ROOT, `${profile}.yml`);
};

export const getDefaultProfilePath = () => {
  return path.join(os.homedir(), PROFILE_ROOT, DEFAULT_PROFILE_SYMLINK);
};

export const getProfileName = (profilePath: string) => {
  return path.basename(profilePath, '.yml');
};

/**
 * Set given profile as the default.
 * Creates symlink from `~/.wire/profile/default` -> `~/.wire/profile/<profile>.yml`.
 * @param {string} profile
 * @param {boolean} overwrite
 */
export const setProfileAsDefault = async (profile: string, overwrite = true) => {
  assert(profile, 'Invalid profile name.');

  const symlinkPath = getDefaultProfilePath();
  if (!overwrite && fs.existsSync(symlinkPath)) {
    // Do NOT overwrite if a default profile symlink already exists.
    return;
  }

  await fs.remove(symlinkPath);
  await fs.ensureSymlink(getProfilePath(profile), symlinkPath);
};

/**
 * Get active profile path.
 * Precedence: param (from argv), WIRE_PROFILE ENV, default symlink.
 * @param {string} profile
 */
export const getActiveProfilePath = (profile?: string) => {
  const defaultProfilePath = getDefaultProfilePath();
  const defaultProfileExists = fs.existsSync(defaultProfilePath);

  profile = profile || process.env.WIRE_PROFILE;
  if (!profile && !defaultProfileExists) {
    return null;
  }

  return profile ? getProfilePath(profile) : fs.readlinkSync(defaultProfilePath);
};

/**
 * Init profile from template.
 * @param {string} profile
 * @param {string} templateUrl
 */
export const initProfileFromTemplate = async (profile: string, templateUrl: string) => {
  assert(profile);
  assert(templateUrl);

  const profilePath = getProfilePath(profile);

  if (fs.existsSync(profilePath)) {
    throw new Error(`Profile already exists: ${profilePath}`);
  }

  fs.ensureFileSync(profilePath);
  fs.writeFileSync(profilePath, await download(templateUrl));

  // Set as default, but don't overwrite existing default.
  // Effectively, first profile becomes the default.
  await setProfileAsDefault(profile, false);
};

/**
 * Get config from default or specified .yml file.
 * @param {string} configFilePath
 * @param {object} argvConf
 */
export const getConfig = (configFilePath: string, argvConf = {}) => {
  assert(configFilePath);

  if (configFilePath.startsWith('~')) {
    configFilePath = configFilePath.replace('~', os.homedir());
  } else {
    configFilePath = path.resolve(process.cwd(), configFilePath);
  }

  if (!fs.existsSync(configFilePath)) {
    throw new Error(`${configFilePath} does not exist.`);
  }

  const customConfig = yaml.load(fs.readFileSync(configFilePath).toString());

  const config = new Config(
    argvConf,
    mapFromKeyValues(yaml.load(envmap.toString()), process.env),
    customConfig,
    { cli: { peerId: createId() } }
  );

  return config;
};

/**
 * @param {object} config
 */
export const mapConfigToEnv = (config: any) => {
  assert(config);

  return mapToKeyValues(yaml.load(envmap.toString()), config.values);
};
