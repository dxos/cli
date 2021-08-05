//
// Copyright 2020 DXOS.org
//

import { exec } from 'child_process';

/**
 * Init nvm if required.
 * @param {String} command
 */
export const prepareExec = (command: string) => {
  if (command === 'npm') {
    command = '[ -s "$NVM_DIR/nvm.sh" ] && [[ "$(which node)" == *".nvm"* ]] && unset PREFIX && \. "$NVM_DIR/nvm.sh" ; npm'; // eslint-disable-line no-useless-escape
  }
  return command;
};

/**
 * Checks if yarn is used as a package manager.
 * @param {String} packageName - package to check.
 */
export const isGlobalYarn = async (packageName: string) => {
  return new Promise((resolve, reject) => {
    const args = 'list -g --depth 0 --json --silent';

    exec(`${prepareExec('npm')} ${args}`, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(!(Object.keys(JSON.parse(String(data)).dependencies).includes(packageName)));
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};

/**
 * Determines path to globally installed node_modules.
 * @param {boolean} isYarn
 */
export const getGlobalModulesPath = async (isYarn = false) => {
  const command = isYarn ? 'echo $(yarn global dir)/node_modules' : `${prepareExec('npm')} root --quiet -g`;

  return new Promise((resolve, reject) => {
    exec(command, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(String(data).trim());
      }
    });
  });
};
