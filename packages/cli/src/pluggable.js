//
// Copyright 2020 DXOS.org
//

/* eslint import/no-dynamic-require: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */
/* eslint global-require: 0 */

import { exec } from 'child_process';
import findRoot from 'find-root';
import fs from 'fs';
import isArray from 'lodash.isarray';
import ora from 'ora';
import path from 'path';
import readPkgUp from 'read-pkg-up';

import { prepareExec, isGlobalYarn } from '@dxos/cli-core';

import { addInstalled } from './extensions';

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

/**
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 */
const runCommand = async (command, args, options) => {
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
        resolve();
      }
    });
  });
};

/**
 * Finds root dir of a workspace.
 * @param {String} from
 */
const getWorkspaceRoot = from => {
  try {
    return findRoot(from, dir => {
      const pkgPath = path.join(dir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const { workspaces } = require(pkgPath);
        return workspaces && (isArray(workspaces) || workspaces.packages);
      }
    });
  } catch (err) {
    return '';
  }
};

/**
 * Pluggable CLI module.
 */
export class Pluggable {
  _modulePath;

  /**
   * Pluggable factory.
   * @param {Object} options
   */
  static create (options) {
    return new Pluggable(options);
  }

  /**
   * @constructor
   * @param {String} moduleName
   * @param {String} version
   */
  constructor ({ moduleName, version }) {
    this._moduleName = moduleName;
    this._version = version;
    this._workspaceRoot = getWorkspaceRoot(__dirname);
    this._isInWorkspace = this._workspaceRoot && fs.existsSync(path.resolve(this._workspaceRoot, 'node_modules', this._moduleName));
    this._installed = this.isInstalled();
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

  get modulePath () {
    if (!this._modulePath) {
      const { moduleName } = this;
      const pkgPath = require.resolve(`${moduleName}/package.json`);
      const pkg = require(pkgPath);
      this._modulePath = path.resolve(path.dirname(pkgPath), pkg.main);
    }
    return this._modulePath;
  }

  get module () {
    const module = require(this.modulePath);
    const moduleCli = module.default ?? module; // Difference between `module.exports` and `export default`.
    return moduleCli;
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
    if (this._isInWorkspace) {
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
  async installModule (npmClient, options = {}) {
    const moduleName = this._moduleName;
    const version = this._version;

    if (this.isWorkspace()) {
      console.error(`The module ${moduleName}@${version} has to be added to devDependencies.`);
      return;
    }

    const isYarn = npmClient ? npmClient === 'yarn' : await isGlobalYarn(pkg.package.name);

    const command = isYarn ? 'yarn' : 'npm';
    const args = isYarn ? ['global', 'add'] : ['install', '-g'];
    args.push(`${moduleName}${version ? `@${version}` : ''}`);

    return runCommand(command, args, options);
  }

  /**
   * Uninstall CLI extension.
   */
  async uninstallModule (npmClient, options = {}) {
    const moduleName = this._moduleName;

    if (this.isWorkspace()) {
      console.error(`The module ${moduleName} has to be removed from devDependencies.`);
      return;
    }

    const isYarn = npmClient ? npmClient === 'yarn' : await isGlobalYarn(pkg.package.name);

    const command = isYarn ? 'yarn' : 'npm';
    const args = isYarn ? ['global', 'remove'] : ['uninstall', '-g'];
    args.push(`${moduleName}`);

    return runCommand(command, args, options);
  }

  /**
   * Init extension in a scope of main CLI.
   * @param {Object} state
   */
  async init (state) {
    return this.module.init(state);
  }

  /**
   * Destroy extension in a scope of main CLI.
   * @param {Object} state
   */
  async destroy (state) {
    return this.module.destroy(state);
  }

  /**
   * Runs command of an CLI extension.
   * @param {Object} state
   * @param {Object} argv
   */
  async run (state, argv) {
    const { installed, moduleName, version } = this;
    if (!installed) {
      const spinner = `Installing ${moduleName}${version ? `@${version}` : ''}`;
      try {
        await this.installModule(null, { spinner });
        await addInstalled(moduleName, this.getInfo());

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

  getInfo () {
    this._cleanCache();
    return this.module.info;
  }

  getDockerCompose () {
    this._cleanCache();
    return this.module.dockerCompose;
  }

  _cleanCache () {
    delete require.cache[require.resolve(this.modulePath)];
  }
}
