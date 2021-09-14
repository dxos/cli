//
// Copyright 2021 DXOS.org
//

import { mnemonicGenerate } from '@polkadot/util-crypto';

import { print } from '@dxos/cli-core';
import { Params } from './common';

export const generateAccount = () => async (argv: any) => {
  const { json } = argv;

  const mnemonic = mnemonicGenerate();

  print({ mnemonic }, { json });
};

export const listAccounts = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const { json } = argv;
  const account = client.keypair?.address

  print({ account }, { json });
};
