//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler, print } from '@dxos/cli-core';

import { DXNSClient } from '../';

interface Params {
  config: any,
  getDXNSClient: Function
}

export const DXNSModule = (params: Params) => {
  const { config, getDXNSClient } = params;
  return {
  command: ['dxns'],
  describe: 'DXNS operations.',
  builder: (yargs: Argv) => yargs
    .command({
      command: ['test'],
      describe: 'Test DXNS command.',

      handler: asyncHandler(async (argv: any) => {
        const { json } = argv;

        const client = await getDXNSClient();

        const domains = await client.registryApi.getDomains();

        print(domains.map((domain: any) => ({
          domainKey: domain.domainKey.toHex(),
          name: domain.name,
          owners: domain.owners
        })), { json });
      })
    })
}
};
