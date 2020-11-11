//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import IpfsHttpClient, { globSource } from 'ipfs-http-client';
import path from 'path';
import semverInc from 'semver/functions/inc';
import set from 'lodash.set';
import pify from 'pify';
import folderSize from 'get-folder-size';
import cliProgress from 'cli-progress';

import { log } from '@dxos/debug';
import { readFile, writeFile } from '@dxos/cli-core';

import { APP_CONFIG_FILENAME } from '../config';

const getFolderSize = pify(folderSize);

const DEFAULT_DIST_PATH = 'dist';

export const publish = config => async ({ timeout, path: distPath = DEFAULT_DIST_PATH }) => {
  const appConfig = await readFile(APP_CONFIG_FILENAME);
  log(`Publishing ${appConfig.name}...`);

  const ipfsServer = config.get('services.ipfs.server');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const ipfs = IpfsHttpClient({
    url: ipfsServer,
    timeout: timeout || '10m'
  });

  const publishFolder = path.join(process.cwd(), appConfig.publish || distPath);

  const source = globSource(publishFolder, { recursive: true });
  const total = await getFolderSize(publishFolder);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const addResult = await ipfs.add(source, { progress: bytes => bar.update(bytes) });

  bar.update(total);
  bar.stop();

  const cid = addResult.cid.toString();

  // Update CID in app.yml.
  set(appConfig, 'package["/"]', cid);
  appConfig.version = semverInc(appConfig.version, 'patch');
  await writeFile(appConfig, APP_CONFIG_FILENAME);

  log(`Published ${appConfig.name}@${appConfig.version} with cid ${cid}`);
};
