//
// Copyright 2020 DxOS.
//

import assert from 'assert';
import IpfsHttpClient, { globSource } from 'ipfs-http-client';
import path from 'path';
import semverInc from 'semver/functions/inc';

import { log } from '@dxos/debug';
import { readFile, writeFile } from '@dxos/cli-core';

import { PAD_CONFIG_FILENAME } from '../config';

const DEFAULT_DIST_PATH = 'dist';

export const publish = config => async ({ path: distPath = DEFAULT_DIST_PATH }) => {
  const appConfig = await readFile(PAD_CONFIG_FILENAME);
  log(`Publishing ${appConfig.name}...`);

  const ipfsServer = config.get('services.ipfs.server');
  assert(ipfsServer, 'Invalid IPFS Server.');

  const ipfs = IpfsHttpClient(ipfsServer);

  const publishFolder = path.join(process.cwd(), appConfig.publish || distPath);

  const uploadedFiles = [];

  // eslint-disable-next-line
  for await (const file of ipfs.add(globSource(publishFolder, { recursive: true }))) {
    uploadedFiles.push(file.cid.toString());
  }

  assert(uploadedFiles.length, 'No files to upload.');

  const cid = uploadedFiles.pop();

  // Update CID in app.yml.
  appConfig.package = cid;
  appConfig.version = semverInc(appConfig.version, 'patch');
  await writeFile(appConfig, PAD_CONFIG_FILENAME);

  log(`Published ${appConfig.name}@${appConfig.version} with cid ${cid}`);
};
