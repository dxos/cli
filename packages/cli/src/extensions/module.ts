//
// Copyright 2020 DXOS.org
//

import { asyncHandler, CoreState, Extension /*, getLoggers */ } from '@dxos/cli-core';

import { Pluggable } from './pluggable';

// const { debugLog } = getLoggers();

/**
 * Wrapper class for CLI extension.
 */
export class PluggableModule {
  _pluggable?: Pluggable;

  constructor (
    private readonly _extension: Extension,
    private readonly _state: CoreState
  ) {}

  get pluggable () {
    if (!this._pluggable) {
      this._pluggable = Pluggable.create(this._extension);
    }

    return this._pluggable;
  }

  async init () {
    if (this.pluggable.installed) {
      await this.pluggable.init(this._state);
    }
  }

  async destroy () {
    if (this.pluggable.installed && this.pluggable.destroy) {
      await this.pluggable.destroy(this._state);
    }
  }

  /**
   * Export the Yargs module.
   */
  // TODO(burdon): Type.
  export (): any[] {
    const { /* moduleName, */ modules } = this._extension;
    return modules.map(({ command, description }) => {
      return (() => {
        // debugLog(`Export ${moduleName}:${command}`);

        return {
          command,
          describe: description,
          builder: (yargs: any) => yargs.help(false).strict(false),
          handler: asyncHandler(async (argv: any) => {
            return this.pluggable.run(this._state, argv);
          })
        };
      });
    });
  }
}
