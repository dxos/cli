//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';

import { Params } from './common';

export const getBlocks = (params: Params) => async (argv: any) => {
  const { json } = argv;

  const { getDXNSClient } = params;

  const client = await getDXNSClient();

  await client.apiRaw.rpc.chain.subscribeNewHeads((header: any) => {
    print({ block: header.number }, { json });
  });
};
