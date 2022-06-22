//
// Copyright 2022 DXOS.org
//

import download from 'download';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { log } from '@dxos/debug';

import { IPFS_VERSION } from '../config';

const CONFIG = { timeout: 30000, extract: true, strip: 1 };

export const install = () => async () => {
  let ipfsArch = `${process.platform}-`;
  switch (process.arch) {
    case 'arm64': {
      ipfsArch += 'arm64';
      break;
    }
    case 'x64': {
      ipfsArch += 'amd64';
      break;
    }
    case 'arm': {
      ipfsArch += 'arm';
      break;
    }
    default: {
      throw new Error(`Unsupported architecture: ${process.arch}.`);
    }
  }

  const tempPath = path.join(os.tmpdir(), new Date().getTime().toString());

  try {
    process.removeAllListeners('warning');
    await download(
      `https://dist.ipfs.io/go-ipfs/${IPFS_VERSION}/go-ipfs_${IPFS_VERSION}_${ipfsArch}.tar.gz`,
      tempPath,
      CONFIG
    );

    await fs.copy(path.join(tempPath, 'ipfs'), '/usr/local/bin/ipfs');
    await fs.remove(tempPath);
  } catch (err: any) {
    if (err.statusCode === 404) {
      throw new Error(`Unable to locate ipfs bin for ${ipfsArch} architecture.`);
    } else if (err.code === 'EACCES') {
      log(`Permission denied while installing. Finish installation with the command: "sudo cp ${path.join(tempPath, 'ipfs')} /usr/local/bin/"`);
    }
  }
};
