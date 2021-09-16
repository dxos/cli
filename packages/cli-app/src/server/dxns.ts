//
// Copyright 2020 DXOS.org
//

import { ApiPromise, WsProvider } from '@polkadot/api';

import { RegistryApi, definitions } from '@dxos/registry-api';

export const getRegistryApi = async (dxnsServer: string) => {
  const provider = new WsProvider(dxnsServer);
  const types = Object.values(definitions).reduce((res, { types }) => ({ ...res, ...types }), {});
  const api = await ApiPromise.create({ provider, types });

  return new RegistryApi(api, undefined);
};
