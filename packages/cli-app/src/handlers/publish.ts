//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import cliProgress from 'cli-progress';
import folderSize from 'get-folder-size';
import IpfsHttpClient from 'ipfs-http-client';
import { ClientOptions } from 'ipfs-http-client/src/lib/core';
import set from 'lodash.set';
import path from 'path';
import pify from 'pify';

import { log } from '@dxos/debug';

import { loadAppConfig, updateAppConfig } from './config';
const { globSource } = IpfsHttpClient as any;

const getFolderSize = pify(folderSize);

const DEFAULT_DIST_PATH = 'dist';

interface PublishParams {
  timeout?: ClientOptions['timeout'],
  path?: string
}

export const publish = (config: any) => async ({ timeout, path: distPath = DEFAULT_DIST_PATH }: PublishParams) => {
  const conf: any = await loadAppConfig();

  log(`Publishing ${conf.name}...`);

  const ipfsServer = config.get('services.ipfs.server');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const ipfs = IpfsHttpClient({
    url: ipfsServer,
    timeout: timeout || '10m'
  });

  const publishFolder = path.join(process.cwd(), conf.publish || distPath);

  const source = globSource(publishFolder, { recursive: true });
  const total = await getFolderSize(publishFolder);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const addResult = await ipfs.add(source, { progress: (bytes: any) => bar.update(bytes) });

  bar.update(total);
  bar.stop();

  const cid = addResult.cid.toString();

  // Update CID in app.yml.
  set(conf, 'package["/"]', cid);
  await updateAppConfig(conf);

  log(`Published ${conf.name}@${conf.version} with cid ${cid}`);
};
