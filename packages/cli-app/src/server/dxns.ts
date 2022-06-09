//
// Copyright 2020 DXOS.org
//

import { ApiPromise, WsProvider } from '@polkadot/api';

import { RegistryClient, definitions, PolkadotRegistryClientBackend } from '@dxos/registry-client';

export const getRegistryClient = async (dxnsServer: string) => {
  const provider = new WsProvider(dxnsServer);
  const types = Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
  const api = await ApiPromise.create({ provider, types });

  return new RegistryClient(new PolkadotRegistryClientBackend(api, undefined));
};
