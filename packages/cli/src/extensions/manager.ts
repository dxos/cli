//
// Copyright 2020 DXOS.org
//

import os from 'os';
import path from 'path';

import { Extension, readFile, writeFile } from '@dxos/cli-core';

export const EXTENSIONS_CONFIG = '.dx/extensions.yml';

const filePath = path.join(os.homedir(), EXTENSIONS_CONFIG);

/**
 * Manages saved extension info.
 */
export class ExtensionManager {
  _extensions: Extension[] = [];

  // TODO(burdon): Change to sync read/write.

  async load () {
    const { extensions = [] } = await readFile(filePath, { absolute: true });
    this._extensions = extensions;
  }

  async save (extensions: any[]) {
    return writeFile({ extensions }, filePath, { absolute: true });
  }

  async get (name: string) {
    await this.load();
    return this._extensions.find(({ moduleName }) => moduleName === name);
  }

  async add (name: string, info: any) { // TODO(burdon): Type.
    await this.load();
    const extensions = this._extensions.filter(({ moduleName }) => moduleName !== name);
    const { package: { version }, modules, description } = info;
    extensions.push({
      moduleName: name,
      version,
      description,
      modules
    });

    await this.save(extensions);
  }

  async remove (name: string) {
    await this.load();
    const extensions = this._extensions.filter(({ moduleName }) => moduleName !== name);
    await this.save(extensions);
  }

  async list () {
    await this.load();
    this._extensions.sort(({ moduleName: a }, { moduleName: b }) => a > b ? 1 : a < b ? -1 : 0);
    return this._extensions;
  }
}
