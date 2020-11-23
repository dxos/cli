//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import mime from 'mime-types';
import fs from 'fs';
import IpfsHttpClient, { globSource } from 'ipfs-http-client';
import path from 'path';
import pify from 'pify';
import folderSize from 'get-folder-size';
import cliProgress from 'cli-progress';

import { log } from '@dxos/debug';

const getFolderSize = pify(folderSize);

export const publish = config => async ({ timeout, path: target, quiet }) => {
  if (!quiet) {
    log(`Publishing ${target}...`);
  }

  const ipfsServer = config.get('services.ipfs.server');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const ipfs = IpfsHttpClient({
    url: ipfsServer,
    timeout: timeout || '10m'
  });

  let source;
  let total;

  const publishTarget = path.join(process.cwd(), target);
  const stat = fs.lstatSync(publishTarget);
  let contentType;
  if (stat.isDirectory()) {
    contentType = 'inode/directory; charset=binary';
    source = globSource(publishTarget, { recursive: true });
    total = await getFolderSize(publishTarget);
  } else {
    contentType = mime.lookup(publishTarget) || undefined;
    source = globSource(publishTarget);
    total = stat.size;
  }

  const bar = quiet ? { update: () => {}, start: () => {}, noop: () => {}, stop: () => {} }
    : new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const addResult = await ipfs.add(source, { progress: bytes => bar.update(bytes) });
  bar.update(total);
  bar.stop();

  return { cid: addResult.cid.toString(), contentType, fileName: target };
};
