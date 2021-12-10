//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { DigitalOceanProvider } from '../providers';

export const get = (config) => async ({ name, json }) => {
  // TODO(egorgripasov): Multiple providers.
  const provider = new DigitalOceanProvider(config);
  const result = await provider.get(name);
  if (result) {
    print(result, { json });
  }
};
