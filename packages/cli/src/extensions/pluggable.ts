//
// Copyright 2020 DXOS.org
//

/* eslint @typescript-eslint/no-var-requires: 0 */
/* eslint global-require: 0 */

import fs from 'fs';
import path from 'path';
import readPkgUp from 'read-pkg-up';
import stripJsonComments from 'strip-json-comments';

import { isGlobalYarn, CoreState, Extension, CLIObject } from '@dxos/cli-core';

import { ExtensionManager } from './manager';
import { getWorkspaceRoot, runCommand } from './utils';

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

/**
 * Pluggable CLI module.
 */
export class Pluggable {
  _modulePath?: string;
  _moduleName: string;
  _version: string;
  _workspaceRoot: string;
  // Rush projects types.
  _workspacePackages: { packageName: string, projectFolder: string }[];
  _workspaceInfo?: { projectFolder: string };
  _isInWorkspace?: boolean;
  _isInCWD: boolean;
  _installed: boolean;

  /**
   * Pluggable factory.
   */
  static create (extension: Extension) {
    return new Pluggable(extension);
  }

  constructor ({ moduleName, version }: Extension) {
    this._moduleName = moduleName;
    this._version = version;

    this._workspaceRoot = getWorkspaceRoot(__dirname);

    this._workspacePackages = this._workspaceRoot &&
      JSON.parse(stripJsonComments(fs.readFileSync(path.join(this._workspaceRoot, 'rush.json')).toString())).projects;

    this._workspaceInfo = this._workspacePackages &&
      this._workspacePackages.find(module => module.packageName === this._moduleName);

    this._isInWorkspace = this._workspaceInfo &&
      fs.existsSync(path.join(this._workspaceRoot, this._workspaceInfo.projectFolder));

    this._isInCWD = fs.existsSync(path.join(process.cwd(), 'package.json')) &&
      require(path.join(process.cwd(), 'package.json'))?.name === this._moduleName;

    this._installed = this.isInstalled();
  }

  /**
   * Returns the exported info.
   */
  get module (): CLIObject {
    const module = require(this.modulePath);
    const cli = module.default ?? module; // Difference between `module.exports` and `export default`.
    return cli;
  }

  get modulePath () {
    if (!this._modulePath) {
      let pkgPath;
      if (this._isInCWD) {
        pkgPath = path.join(process.cwd(), 'package.json');
      } else if (this._isInWorkspace) {
        pkgPath = path.join(this._workspaceRoot, this._workspaceInfo!.projectFolder, 'package.json');
      } else {
        pkgPath = `${this.moduleName}/package.json`;
      }

      const pkg = require(pkgPath);
      this._modulePath = path.join(pkgPath.replace('package.json', ''), pkg.main);
    }

    return this._modulePath;
  }

  get moduleName () {
    return this._moduleName;
  }

  get version () {
    return this._version;
  }

  get workspaceRoot () {
    return this._workspaceRoot;
  }

  get installed () {
    return this._installed;
  }

  get isInWorkspace () {
    return this._isInWorkspace;
  }

  /**
   * Checks if workspace is defined.
   */
  isWorkspace () {
    return !!this.workspaceRoot;
  }

  /**
   * Checks if extension is installed.
   */
  isInstalled () {
    const { moduleName } = this;
    if (this._isInWorkspace || this._isInCWD) {
      return true;
    }
    try {
      const pkgPath = require.resolve(`${moduleName}/package.json`);
      const pkg = require(pkgPath);
      // Check if module is installed and version matches cli version.
      return !!pkg;
      // TODO(egorgripasov): Extension compatibility. Semver?
      // && pkg.version === this.version;
    } catch (err) {
      return false;
    }
  }

  /**
   * Install CLI extension.
   */
  async installModule (npmClient?: string, options = {}) {
    const moduleName = this._moduleName;
    const version = this._version;

    if (this.isWorkspace()) {
      console.error(`The module ${moduleName}@${version} has to be added to devDependencies.`);
      return;
    }

    const isYarn = npmClient ? npmClient === 'yarn' : await isGlobalYarn(pkg!.package.name);

    const command = isYarn ? 'yarn' : 'npm';
    const args = isYarn ? ['global', 'add'] : ['install', '-g'];
    args.push(`${moduleName}${version ? `@${version}` : ''}`);

    return runCommand(command, args, options);
  }

  /**
   * Uninstall CLI extension.
   */
  async uninstallModule (npmClient: string, options = {}) {
    const moduleName = this._moduleName;

    if (this.isWorkspace()) {
      console.error(`The module ${moduleName} has to be removed from devDependencies.`);
      return;
    }

    const isYarn = npmClient ? npmClient === 'yarn' : await isGlobalYarn(pkg!.package.name);

    const command = isYarn ? 'yarn' : 'npm';
    const args = isYarn ? ['global', 'remove'] : ['uninstall', '-g'];
    args.push(`${moduleName}`);

    return runCommand(command, args, options);
  }

  /**
   * Init extension in a scope of main CLI.
   */
  async init (state: CoreState) {
    return this.module.init?.(state);
  }

  /**
   * Destroy extension in a scope of main CLI.
   */
  async destroy (state: CoreState) {
    return this.module.destroy?.(state);
  }

  async handleExit (state: CoreState) {
    return this.module.onExit?.(state);
  }

  /**
   * Runs command of an CLI extension.
   */
  async run (state: CoreState, argv: any) {
    const { installed, moduleName, version } = this;
    if (!installed) {
      const spinner = `Installing ${moduleName}${version ? `@${version}` : ''}`;
      try {
        await this.installModule(undefined, { spinner });

        const extensionManager = new ExtensionManager();
        await extensionManager.add(moduleName, this.getInfo());

        const { init, destroy } = this.module;
        if (init || destroy) {
          console.log(`${moduleName} was successfully installed. Please run your command again.`);
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    return this.module.runAsExtension(state, argv);
  }

  getInfo (): Extension {
    this._cleanCache();
    return this.module.info;
  }

  getDockerCompose () {
    this._cleanCache();
    return this.module.docker;
  }

  _cleanCache () {
    delete require.cache[require.resolve(this.modulePath)];
  }
}
