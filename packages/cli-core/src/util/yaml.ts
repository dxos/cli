//
// Copyright 2020 DXOS.org
//

import { ensureFile } from 'fs-extra';
import { read, write } from 'node-yaml';
import path from 'path';

type Options = {
  absolute? : boolean
}

export const assureFile = async (filename: string, absolute: boolean = false) => {
  const file = absolute ? filename : path.join(process.cwd(), filename);
  await ensureFile(file);
  return file;
};

/**
 * @returns {Object}
 */
export const readFile = async (filename: string, options: Options = {}) => {
  const { absolute } = options;
  const file = await assureFile(filename, absolute);
  const data = await read(file) || {};

  return data;
};

/**
 * @param {Object} data
 */
export const writeFile = async (data: any = {}, filename: string, options: Options = {}) => {
  const { absolute } = options;
  const file = await assureFile(filename, absolute);
  await write(file, data);
};
