//
// Copyright 2022 DXOS.org
//

import { Config } from '@dxos/config';

export const EXTENSION_CONFIG_FILENAME = 'dx.yml';

/**
 * Global CLI state.
 */
export interface CoreState {
  config?: Config
  cliState: {
    interactive: boolean
  }
  models?: any[]
  modules?: Array<Function>
  profilePath?: string | undefined
  profileExists?: boolean
  options?: {
    prompt?: any
    baseCommand?: any
    enableInteractive?: boolean
  }
  getModules?: Function
  getReadlineInterface?: Function
}

/**
 * Config from dx.yml file.
 */
// TODO(burdon): Use consistently across all packages.
export type Extension = {
  moduleName: string
  version: string
  displayName: string
  description: string
  modules: {
    command: string
    description?: string
  }[]
};

// TODO(burdon): Reconcile with Extension.
export interface ExtensionInfo {
  modules?: Array<any>
  getModules?: Function
  version: string
  init?: Function
  destroy?: Function
  onExit?: Function
  options?: any
  state?: any
}
