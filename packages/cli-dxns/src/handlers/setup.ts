//
// Copyright 2021 DXOS.org
//

import fetch from 'node-fetch';

import { print } from '@dxos/cli-core';

export const setKeys = () => async (argv: any) => {
  const { server, type, publicKey, mnemonic, json } = argv;

  const body = `{
    "jsonrpc":"2.0",
    "id":1,
    "method":"author_insertKey",
    "params": [
      "${type}",
      "${mnemonic.join(' ')}",
      "${publicKey}"
    ]
  }`;

  const response = await fetch(server, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  const result = await response.json();

  print(result, { json });
};
