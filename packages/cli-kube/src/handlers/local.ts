//
// Copyright 2022 DXOS.org
//

import https from 'https';
import fetch from 'node-fetch';

import { print } from '@dxos/cli-core';

// TODO(egorgripasov): From config.
const LOCAL_KUBE_URL = 'https://kube.local';

const agent = new https.Agent({
  rejectUnauthorized: false
});

export const ping = () => async () => {
  const response = await fetch(`${LOCAL_KUBE_URL}/matrix/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping' }),
    agent
  });
  const result = await response.json();

  print(result, { json: true });
};

export const status = () => async () => {
  const response = await fetch(`${LOCAL_KUBE_URL}/kube/services?usage=true`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    agent
  });
  const result = await response.json();

  print(result, { json: true });
};
