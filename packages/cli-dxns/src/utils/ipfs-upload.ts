//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import fs from 'fs';

export const uploadToIPFS = (path: string): string => {
  const options = ['add', path];
  if (!fs.existsSync(path)) {
    throw new Error('Incorrect path to definitons. File or directory does not exist');
  }
  if (fs.lstatSync(path).isDirectory()) {
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
  return hash;
};
