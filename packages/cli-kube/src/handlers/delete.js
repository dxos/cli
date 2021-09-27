//
// Copyright 2021 DXOS.org
//

import { DigitalOceanProvider } from '../providers';

export const del = (config) => async ({ name }) => {
  // TODO(egorgripasov): Multiple providers.
  const provider = new DigitalOceanProvider(config);
  await provider.delete(name);
};
