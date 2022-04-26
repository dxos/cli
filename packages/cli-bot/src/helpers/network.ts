//
// Copyright 2022 DXOS.org
//

import { NetworkManager } from '@dxos/network-manager';
import type { Config } from '@dxos/config';

export const createNetworkManager = (config: Config): NetworkManager => {
  return new NetworkManager({
    signal: [config.get('runtime.services.signal.server')!],
    ice: config.get('runtime.services.ice'),
    log: true
  });
}
