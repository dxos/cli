//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import eos from 'end-of-stream-promise';
import fs from 'fs';
import path from 'path';
import IpfsHttpClient from 'ipfs-http-client';

import { Registry } from '@dxos/registry-client';

const toStream = require('it-to-stream');

export const download = config => async ({ timeout, name, id, outdir = '.' }) => {
  assert(name || id, '--name or --id required');

  const ipfsServer = config.get('services.ipfs.server');
  const { server, chainId } = config.get('services.wns');

  assert(server, 'Invalid WNS endpoint.');
  assert(chainId, 'Invalid WNS Chain ID.');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const registry = new Registry(server, chainId);
  const ipfs = IpfsHttpClient({
    url: ipfsServer,
    timeout: timeout || '10m'
  });

  let records = [];
  if (id) {
    records = await registry.getRecordsByIds([id]);
  } else {
    records = (await registry.resolveNames([name])).records;
  }

  if (records.length !== 1) {
    throw new Error('item not found.');
  }

  const record = records[0];
  const fileName = record.attributes.fileName;

  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }

  // eslint-disable-next-line
  for await (const item of ipfs.get(record.attributes.package['/'])) {
    let filePath = item.path;
    if (fileName) {
      const parts = item.path.split('/');
      filePath = parts.length === 1 ? fileName : path.join(fileName, ...parts.slice(1));
    }
    const fullPath = path.join(outdir, filePath);
    console.error(fullPath);
    if (item.type === 'dir') {
      fs.mkdirSync(fullPath);
    } else {
      const readSteam = toStream(item.content);
      const writeStream = fs.createWriteStream(fullPath);
      readSteam.pipe(writeStream);
      await eos(readSteam);
      writeStream.close();
    }
  }
};
