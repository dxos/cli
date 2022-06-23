//
// Copyright 2022 DXOS.org
//

/* eslint-disable */

import { exec } from '@dxos/cli-core';

const defaultOptions = { retryCount: 5 };

export const init = () => async () => {
  try {
    await exec('ipfs config show 1>/dev/null 2>/dev/null');
  } catch (_) {
    await exec('ipfs init --profile=lowpower');
  }

  await exec('ipfs config Reprovider.Strategy pinned', defaultOptions);
  // Remove default bootstraps (we'll add out own elsewhere).
  await exec('ipfs bootstrap rm --all', defaultOptions);
  // Configure the multiaddr-formatted address where our gateway can be reached
  await exec('ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001', defaultOptions);
  await exec('ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8888', defaultOptions);
  // Disable IPFS mDNS since it goes rogue.
  await exec('ipfs config Discovery.MDNS.Enabled --bool false', defaultOptions);

  // Allow cross origin requests so our content can make use of outside resources.
  // See https://discuss.ipfs.io/t/writeable-http-gateways/210
  await exec(`ipfs config Gateway.HTTPHeaders.Access-Control-Allow-Origin --json '["*"]'`);
  await exec(`ipfs config Gateway.HTTPHeaders.Access-Control-Allow-Methods --json '["GET", "POST"]'`);
  await exec(`ipfs config Gateway.HTTPHeaders.Access-Control-Allow-Headers --json '["Authorization", "X-Requested-With", "Range"]'`);
  await exec(`ipfs config Gateway.HTTPHeaders.Access-Control-Expose-Headers --json '["Location", "Ipfs-Hash"]'`);
  await exec(`ipfs config Gateway.HTTPHeaders.Access-Control-Allow-Credentials --json '["true"]'`);
  await exec(`ipfs config API.HTTPHeaders.Access-Control-Allow-Origin --json '["*"]'`);
  await exec(`ipfs config API.HTTPHeaders.Access-Control-Allow-Credentials --json '["true"]'`);

  // Half the size of / in GiBs (# of 512B blocks * GiB/512B / 2).
  const repoSize = await exec(`df -P / | awk 'NR == 2 {print int($2 / 2097152 / 2) }'`);
  if (repoSize && parseInt(repoSize) > 10) {
    await exec(`ipfs config Datastore.StorageMax "${repoSize}GB"`)
  }
};
