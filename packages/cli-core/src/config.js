//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import os from 'os';
import yaml from 'js-yaml';
import path from 'path';
import download from 'download';

import { createId } from '@dxos/crypto';
import { Config, mapFromKeyValues } from '@dxos/config';

import envmap from '../env-map.yml';

export const PROFILE_ROOT = '.wire/profile';

// Default profile, ALWAYS a symlink.
export const DEFAULT_PROFILE_SYMLINK = 'default';

export const getProfilePath = (profile) => {
  return path.join(os.homedir(), PROFILE_ROOT, `${profile}.yml`);
};

export const getDefaultProfilePath = () => {
  return path.join(os.homedir(), PROFILE_ROOT, DEFAULT_PROFILE_SYMLINK);
};

export const getProfileName = (profilePath) => {
  return path.basename(profilePath, '.yml');
};

/**
 * Set given profile as the default.
 * Creates symlink from `~/.wire/profile/default` -> `~/.wire/profile/<profile>.yml`.
 * @param {string} profile
 * @param {boolean} overwrite
 */
export const setProfileAsDefault = async (profile, overwrite = true) => {
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
export const getActiveProfilePath = (profile) => {
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
export const initProfileFromTemplate = async (profile, templateUrl) => {
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
 * @param {Object} argvConf
 */
export const getConfig = (configFilePath, argvConf = {}) => {
  assert(configFilePath);

  if (configFilePath.startsWith('~')) {
    configFilePath = configFilePath.replace('~', os.homedir());
  } else {
    configFilePath = path.resolve(process.cwd(), configFilePath);
  }

  if (!fs.existsSync(configFilePath)) {
    throw new Error(`${configFilePath} does not exist.`);
  }

  const customConfig = yaml.load(fs.readFileSync(configFilePath));

  const config = new Config(
    argvConf,
    mapFromKeyValues(yaml.load(envmap), process.env),
    customConfig,
    { cli: { peerId: createId() } }
  );

  return config;
};
