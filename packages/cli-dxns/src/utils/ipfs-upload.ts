//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import IpfsHttpClient from 'ipfs-http-client';
const { globSource } = IpfsHttpClient as any;

interface UploadOptions {
  timeout: string | number
  progress?: Function
};

export const uploadToIPFS = async (config: any, path: string, options?: UploadOptions): Promise<string> => {
  const { timeout, progress } = options || {};

  const ipfsServer = config.get('services.ipfs.server');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const ipfsClient = IpfsHttpClient({
    url: ipfsServer,
    timeout: timeout || '1m'
  });

  if (!fs.existsSync(path)) {
    throw new Error('Incorrect path to definitons. File or directory does not exist');
  }
  if (fs.lstatSync(path).isDirectory()) {
    const source = globSource(path, { recursive: true });
    const addResult = await ipfsClient.add(source, { progress });
    return addResult.cid.toString();
  } else {
    const content = fs.readFileSync(path);
    const addResult = await ipfsClient.add(content);
    return addResult.cid.toString();
  }
};
