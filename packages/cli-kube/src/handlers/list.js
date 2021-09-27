//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { DigitalOceanProvider } from '../providers';

export const list = (config) => async ({ json }) => {
  // TODO(egorgripasov): Multiple providers.
  const provider = new DigitalOceanProvider(config);
  const result = await provider.list();
  print(result, { json });
};
