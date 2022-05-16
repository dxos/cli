//
// Copyright 2020 DXOS.org
//

/* eslint @typescript-eslint/no-var-requires: 0 */
/* eslint global-require: 0 */

import { exec } from 'child_process';
import findRoot from 'find-root';
import fs from 'fs';
import ora from 'ora';
import path from 'path';

import { prepareExec } from '@dxos/cli-core';

/**
 * Asynchronosly run the shell command.
 */
export const runCommand = async (command: string, args: string[], options: any) => {
  return new Promise((resolve, reject) => {
    const { spinner: spinnerText } = options;
    const spinner = ora(spinnerText);
    spinner.start();

    exec(`${prepareExec(command)} ${args.join(' ')}`, (err) => {
      if (err) {
        spinner.fail();
        reject(err);
      } else {
        spinner.succeed();
        spinner.clear();
        resolve(true);
      }
    });
  });
};

/**
 * Finds root dir of a workspace.
 */
export const getWorkspaceRoot = (from: string) => {
  try {
    return findRoot(from, dir => {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const { workspaces } = require(pkgPath);
        return workspaces && (Array.isArray(workspaces) || workspaces.packages);
      }
    });
  } catch (err) {
    return '';
  }
};
