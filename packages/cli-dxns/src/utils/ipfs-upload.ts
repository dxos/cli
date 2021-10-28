//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import { create, globSource } from 'ipfs-http-client';
import { dirname, basename } from 'path';

export const uploadToIPFS = async (config: any, path: string): Promise<string> => {
  const ipfsClient = create({ url: config._config.services.ipfs.server });
  if (!fs.existsSync(path)) {
    throw new Error('Incorrect path to definitons. File or directory does not exist');
  }
  if (fs.lstatSync(path).isDirectory()) {
    const base = basename(path);
    const addedFiles = [];
    for await (const file of ipfsClient.addAll(globSource(dirname(path), `${base}/**/*`))) {
      addedFiles.push(file);
    }
    const topLevelDir = addedFiles.find(file => file.path === base);
    assert(topLevelDir, 'Top level ipfs dirdctory not found');
    return topLevelDir.cid.toString();
  } else {
    const content = fs.readFileSync(path);
    const addResult = await ipfsClient.add({ content }, { wrapWithDirectory: true });
    console.log({ hash: addResult.cid.toString() });
    return addResult.cid.toString();
  }
};
