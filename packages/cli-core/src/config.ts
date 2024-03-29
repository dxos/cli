//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import download from 'download';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { Config, mapFromKeyValues, mapToKeyValues } from '@dxos/config';

import envmap from './config/env-map.json';
import { loadYml } from './utils';

export const ENVS = Object.keys(envmap);

export const PROFILE_ROOT = '.dx/profile';

export const STORAGE_ROOT = '.dx/storage';
export const PROFILE_STORE = '.dx/storage/.default';
export const SESSION_PROFILE_STORE = '.dx/storage/.sessions';
export const SERVICES_STORE = '.dx/services';

// Default profile, ALWAYS a symlink.
export const DEFAULT_PROFILE_SYMLINK = 'default';

export const PACKAGE_JSON_FILENAME = 'package.json';
export const DEFAULT_PACKAGE_JSON_ATTRIBUTES = [
  'version', 'license', 'description', 'keywords', 'repository'
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
 * Creates symlink from `~/.dx/profile/default` -> `~/.dx/profile/<profile>.yml`.
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
 * Precedence: param (from argv), DX_PROFILE ENV, default symlink.
 * @param {string} profile
 */
export const getActiveProfilePath = (profile?: string) => {
  const defaultProfilePath = getDefaultProfilePath();
  const defaultProfileExists = fs.existsSync(defaultProfilePath);

  profile = (profile || process.env.DX_PROFILE) || process.env.WIRE_PROFILE;
  if (!profile && !defaultProfileExists) {
    return null;
  }

  return profile ? getProfilePath(profile) : fs.readlinkSync(defaultProfilePath);
};

/**
 * Init profile from template.
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

  const profileConfig = loadYml(configFilePath);

  // TODO(egorgripasov): Cleanup - Adapter to config v1.
  const customConfig = (!profileConfig.version) ? {
    version: 1,
    runtime: {
      ...profileConfig
    }
  } : profileConfig;

  const config = new Config(
    argvConf,
    mapFromKeyValues(envmap, process.env),
    customConfig
  );

  return config;
};

/**
 * @param {object} config
 */
export const mapConfigToEnv = (config: any) => {
  assert(config);

  return mapToKeyValues(envmap, config.values);
};

export const ensureServicesStore = (name: string) => {
  const storePath = path.join(os.homedir(), SERVICES_STORE, name);
  fs.ensureFileSync(storePath);

  return storePath;
};
