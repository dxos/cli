//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { DigitalOceanProvider } from '../providers';

export const deploy = (config) => async (argv) => {
  const { name, memory, region, pin, register, letsencrypt, email, keyPhrase, services, sshKeys, dev, json } = argv;

  // TODO(egorgripasov): Multiple providers.
  const provider = new DigitalOceanProvider(config);

  const result = await provider.deploy({ name, memory, region, pin, register, letsencrypt, email, keyPhrase, services, sshKeys, dev });
  print(result, { json });
};
