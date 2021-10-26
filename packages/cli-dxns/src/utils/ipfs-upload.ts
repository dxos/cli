//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';

import { CID } from '@dxos/registry-client';

export const uploadToIPFS = (path: string, { recursive } = { recursive: false }): CID => {
  const options = ['add', path];
  if (recursive) {
    options.splice(1, 0, '-r');
  }
  const p = spawnSync('ipfs', options, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  const lastAdded = p.output.reverse().find(line => line?.split(' ')[0] === 'added');
  assert(lastAdded, 'Couldn\'t upload types to IPFS');
  const hash = lastAdded.split(' ')[1];
  return CID.from(hash);
};
