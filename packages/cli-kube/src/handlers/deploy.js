//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { DigitalOceanProvider } from '../providers';
import { overrideServices } from '../utils/override';

export const deploy = (config) => async (argv) => {
  const { name, memory, region, pin, register, letsencrypt, email, keyPhrase, services, servicesOverride, sshKeys, dev, json } = argv;

  const servicesToRun = overrideServices(services, servicesOverride);

  // TODO(egorgripasov): Multiple providers.
  const provider = new DigitalOceanProvider(config);

  const result = await provider.deploy({ name, memory, region, pin, register, letsencrypt, email, keyPhrase, services: servicesToRun, sshKeys, dev });
  print(result, { json });
};
