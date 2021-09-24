//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import cliProgress from 'cli-progress';
import fs from 'fs';
import folderSize from 'get-folder-size';
import IpfsHttpClient, { globSource } from 'ipfs-http-client';
import mime from 'mime-types';
import path from 'path';
import pify from 'pify';

import { logError } from '@dxos/debug';

const getFolderSize = pify(folderSize);

export const publish = config => async ({ timeout, target, quiet }) => {
  assert(target, 'target path is required');
  !quiet && logError(`Uploading ${target}...`);

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

  const bar = quiet
    ? { update: () => {}, start: () => {}, stop: () => {} }
    : new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const addResult = await ipfs.add(source, { progress: bytes => bar.update(bytes) });
  bar.update(total);
  bar.stop();

  return { cid: addResult.cid.toString(), contentType, fileName: target };
};
