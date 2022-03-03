//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import findRemoveSync from 'find-remove';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { PROFILE_ROOT, STORAGE_ROOT, PROFILE_STORE, SESSION_PROFILE_STORE } from '../config';

const ensureProfileStore = () => {
  const profileStorePath = path.join(os.homedir(), PROFILE_STORE);
  fs.ensureFileSync(profileStorePath);

  return profileStorePath;
};

const getTmpProfileStorage = () => process.env.TERM_SESSION_ID?.replace(/[^\w\s]/gi, '');

const assureProfileExistance = (name: string) => {
  const profilePath = path.join(os.homedir(), STORAGE_ROOT, name);
  assert(fs.existsSync(profilePath), `Profile ${name} does not exist. Run "dx halo init --name ${name}" to init that profile.`);
  return profilePath;
};

export const CLI_DEFAULT_PERSISTENT = true;

export const getClientProfilePath = (storagePath: string | undefined, name?: string) => {
  if (name) {
    storagePath = path.join(os.homedir(), STORAGE_ROOT, name);
  }
  assert(storagePath, 'Please provide storage path.');

  fs.ensureDirSync(storagePath);
  return storagePath;
};

export const resetStorageForClientProfile = (storagePath: string | undefined, name?: string) => {
  const currentStoragePath = getCurrentProfilePath();
  if (name) {
    storagePath = path.join(os.homedir(), STORAGE_ROOT, name);
  }
  if (!storagePath) {
    storagePath = currentStoragePath;
  }

  assert(storagePath, 'Please provide storage path.');
  fs.removeSync(storagePath);

  if (storagePath === currentStoragePath) {
    saveCurrentProfilePath('');
    cleanSessionProfile();
  }
};

/**
 * Reset storage for all profiles.
 */
export const resetStorage = () => {
  fs.emptyDirSync(path.join(os.homedir(), STORAGE_ROOT));
};

/**
 * Get path to a currently active client storage.
 */
export const getCurrentProfilePath = () => {
  let currentProfilePath;
  // Read from session file.
  const tmpProfileStorage = getTmpProfileStorage();
  if (tmpProfileStorage) {
    const tpmProfilesPath = path.join(os.homedir(), SESSION_PROFILE_STORE, tmpProfileStorage);
    if (fs.existsSync(tpmProfilesPath)) {
      currentProfilePath = fs.readFileSync(tpmProfilesPath, { encoding: 'utf8' });
    }
  }
  // Read from regular file.
  if (!currentProfilePath) {
    const profileStorePath = ensureProfileStore();
    currentProfilePath = fs.readFileSync(profileStorePath, { encoding: 'utf8' });
  }
  return currentProfilePath;
};

/**
 * Save path to a currently active client storage.
 */
export const saveCurrentProfilePath = (currentProfilePath: string) => {
  const profileStorePath = ensureProfileStore();
  fs.writeFileSync(profileStorePath, currentProfilePath, { encoding: 'utf8', flag: 'w' });
};

export const listClientProfileConfigs = () => {
  const profilesPath = path.join(os.homedir(), PROFILE_ROOT);
  const profiles = fs.readdirSync(profilesPath, { withFileTypes: true })
    .filter(file => !file.isDirectory() && file.name.endsWith('.yml'))
    .map(file => file.name.split('.yml')[0]);
  return profiles;
};

export const listClientProfilePaths = () => {
  const storagePath = path.join(os.homedir(), STORAGE_ROOT);
  const profiles = fs.readdirSync(storagePath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);
  return profiles;
};

/**
 * Switch profile within a current terminal session.
 */
export const useProfile = (name: string) => {
  const tmpProfileStorage = getTmpProfileStorage();
  // eslint-disable-next-line
  assert(tmpProfileStorage, `Unable to determine shell session Id. Please update your shell profile with this snippet:\n\n[ -n "$TERM_SESSION_ID" ] || export TERM_SESSION_ID="$(uuidgen)" \n\n and restart yor terminal.`);

  const tpmProfilesRoot = path.join(os.homedir(), SESSION_PROFILE_STORE);

  const currentProfilePath = assureProfileExistance(name);

  // Remove outdated session profiles.
  findRemoveSync(tpmProfilesRoot, {
    age: { seconds: 365 * 24 * 60 * 60 }
  });

  const tpmProfilesPath = path.join(tpmProfilesRoot, tmpProfileStorage);
  fs.ensureFileSync(tpmProfilesPath);
  fs.writeFileSync(tpmProfilesPath, currentProfilePath, { encoding: 'utf8', flag: 'w' });
};

/**
 * Clean profile configuration for current shell session.
 */
export const cleanSessionProfile = () => {
  const tmpProfileStorage = getTmpProfileStorage();
  if (tmpProfileStorage) {
    const tpmProfilesPath = path.join(os.homedir(), SESSION_PROFILE_STORE, tmpProfileStorage);
    fs.existsSync(tpmProfilesPath) && fs.removeSync(tpmProfilesPath);
  }
};

/**
 * Set default profile.
 */
export const setProfile = (name: string) => {
  const currentProfilePath = assureProfileExistance(name);
  saveCurrentProfilePath(currentProfilePath);
};
