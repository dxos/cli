//
// Copyright 2022 DXOS.org
//

export const EXTENSION_CONFIG_FILENAME = 'dx.yml';

/**
 * Generated CLI extension info.
 */
// TODO(burdon): Use consistently across all packages.
export type Extension = {
  moduleName: string
  version: string
  description: string
  modules: {
    command: string
    description: string
  }[]
};

// TODO(burdon): Reconcile with Extension.
export interface ExtensionInfo {
  modules?: Array<any>
  getModules?: Function
  version: string
  init?: Function
  destroy?: Function
  options?: any
  state?: any
}

// TODO(burdon): Change to class.
export interface CLI {
  modules?: any[]
  getModules?: Function
  init?: Function
  destroy?: Function
  dir: string
  main?: boolean
  options?: any
  info: any
  compose?: string
}
