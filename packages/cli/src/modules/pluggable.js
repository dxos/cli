//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';

import { Pluggable } from '../pluggable';

/**
 * Wrapper class for CLI extension.
 */
export class PluggableModule {
  _pluggable = null;

  constructor (config, state) {
    this._config = config;
    this._state = state;
  }

  get pluggable () {
    if (!this._pluggable) {
      this._pluggable = Pluggable.create(this._config);
    }

    return this._pluggable;
  }

  async init () {
    if (this.pluggable.installed) {
      await this.pluggable.init(this._state);
    }
  }

  async destroy () {
    if (this.pluggable.installed) {
      await this.pluggable.destroy(this._state);
    }
  }

  export () {
    const { command, describe } = this._config;

    return command.map(cmd => (() => ({
      command: typeof cmd === 'object' ? cmd.command : cmd,
      describe: typeof cmd === 'object' ? cmd.describe : describe,
      builder: yargs => yargs.help(false).strict(false),
      handler: asyncHandler(async argv => {
        return this.pluggable.run(this._state, argv);
      })
    // eslint-disable-next-line
    })).bind(this));
  }
}
