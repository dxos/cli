//
// Copyright 2020 DXOS.org
//

import os from 'os';
import path from 'path';

import { readFile, writeFile } from '@dxos/cli-core';

export const EXTENSIONS_CONFIG = '.wire/extensions.yml';

const filePath = path.join(os.homedir(), EXTENSIONS_CONFIG);

export const getInfo = async (name) => {
  const { extensions = [] } = await readFile(filePath, { absolute: true });
  return extensions.find(({ moduleName }) => moduleName === name);
};

export const addInstalled = async (name, info) => {
  const { package: { version }, command, description } = info;
  let { extensions = [] } = await readFile(filePath, { absolute: true });
  extensions = extensions.filter(({ moduleName }) => moduleName !== name);

  extensions.push({
    moduleName: name,
    version,
    describe: description,
    command
  });
  return writeFile({ extensions }, filePath, { absolute: true });
};

export const removeInstalled = async (name) => {
  let { extensions = [] } = await readFile(filePath, { absolute: true });
  extensions = extensions.filter(({ moduleName }) => moduleName !== name);
  return writeFile({ extensions }, filePath, { absolute: true });
};

export const listInstalled = async () => {
  const { extensions = [] } = await readFile(filePath, { absolute: true });
  return extensions;
};
