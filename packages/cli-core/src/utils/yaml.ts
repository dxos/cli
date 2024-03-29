//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import { ensureFile } from 'fs-extra';
import yaml from 'js-yaml';
import { read, write } from 'node-yaml';
import path from 'path';

type Options = {
  absolute?: boolean
}

// TODO(burdon): Make synchronous.

export const assureFile = async (filename: string, absolute = false) => {
  const file = absolute ? filename : path.join(process.cwd(), filename);
  await ensureFile(file);
  return file;
};

export const readFile = async (filename: string, options: Options = {}) => {
  const { absolute } = options;
  const file = await assureFile(filename, absolute);
  const data = await read(file) || {};
  return data;
};

export const writeFile = async (data: any = {}, filename: string, options: Options = {}) => {
  const { absolute } = options;
  const file = await assureFile(filename, absolute);
  await write(file, data);
};

export const loadYml = (pathName: string) => {
  const text = readFileSync(pathName);
  return yaml.load(text.toString());
};
