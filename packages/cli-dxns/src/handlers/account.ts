//
// Copyright 2021 DXOS.org
//

import { mnemonicGenerate } from '@polkadot/util-crypto';

import { print } from '@dxos/cli-core';

export const generateAccount = () => async (argv: any) => {
  const { json } = argv;

  const mnemonic = mnemonicGenerate();

  print({ mnemonic }, { json });
};
