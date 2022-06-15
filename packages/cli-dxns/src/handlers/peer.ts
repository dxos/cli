//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import { lookup } from 'dns/promises';
import { URL } from 'url';

import { print } from '@dxos/cli-core';
import { createApiPromise } from '@dxos/registry-client';

export const getPeer = () => async (argv: any) => {
  const { url, json } = argv;

  const apiPromise = await createApiPromise(url);

  const peerResult = await apiPromise.rpc.system.localPeerId();

  await apiPromise.disconnect();

  const info = await lookup(new URL(url).host);
  assert(info?.address, `Not able to Resolve IP address for ${url}`);

  const peerId = peerResult.toString();
  assert(peerId && peerId.length === 52, 'Unable to resolve peerId for provided URL');

  print({ node: `/ip4/${info?.address}/tcp/30333/p2p/${peerId}` }, { json });
};
