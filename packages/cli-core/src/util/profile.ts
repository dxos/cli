//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { STORAGE_ROOT, PROFILE_STORE } from '../config';

const ensureProfileStore = () => {
  const profileStorePath = path.join(os.homedir(), PROFILE_STORE);
  fs.ensureFileSync(profileStorePath);

  return profileStorePath;
};

export const CLI_DEFAULT_PERSISTENT = true;

export const getClientProfilePath = (storagePath: string | undefined, name: string) => {
  if (name) {
    storagePath = path.join(os.homedir(), STORAGE_ROOT, name);
  }
  assert(storagePath, 'Please provide storage path.');

  fs.ensureDirSync(storagePath);
  return storagePath;
};

export const resetStorageForClientProfile = (storagePath: string | undefined, name?: string) => {
  if (name) {
    storagePath = path.join(os.homedir(), STORAGE_ROOT, name);
  }
  if (!storagePath) {
    storagePath = getCurrentProfilePath();
  }

  assert(storagePath, 'Please provide storage path.');
  fs.emptyDirSync(storagePath);
};

export const resetStorage = () => {
  fs.emptyDirSync(path.join(os.homedir(), STORAGE_ROOT));
};

export const getCurrentProfilePath = () => {
  const profileStorePath = ensureProfileStore();
  const currentProfilePath = fs.readFileSync(profileStorePath, { encoding: 'utf8' });
  return currentProfilePath;
};

export const saveCurrentProfilePath = (currentProfilePath: string) => {
  const profileStorePath = ensureProfileStore();
  fs.writeFileSync(profileStorePath, currentProfilePath, { encoding: 'utf8', flag: 'w' });
};

export const listClientProfiles = () => {
  // const storagePath = path.join(os.homedir(), STORAGE_ROOT);
  // TODO(egorgripasov): List all folders in storagePath
};
