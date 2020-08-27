//
// Copyright 2020 DXOS.org
//

import fs from 'fs-extra';
import assert from 'assert';
import fetch from 'node-fetch';
import path from 'path';
import set from 'lodash.set';
import semverInc from 'semver/functions/inc';

import { BOT_CONFIG_FILENAME } from '@dxos/botkit';
import { readFile, writeFile } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const publish = config => async () => {
  // Upload fails without trailing slash.
  let ipfsEndpoint = config.get('services.ipfs.gateway');
  assert(ipfsEndpoint, 'Invalid IPFS Gateway.');

  if (!ipfsEndpoint.endsWith('/')) {
    ipfsEndpoint = `${ipfsEndpoint}/`;
  }

  const files = fs.readdirSync(path.join(process.cwd(), 'out', 'dist'));
  const uploads = await Promise.all(files.map(async (file) => {
    // Upload to IPFS.
    const filePath = path.join(process.cwd(), 'out', 'dist', file);
    const response = await fetch(ipfsEndpoint, {
      method: 'POST',
      body: fs.createReadStream(filePath)
    });

    if (!response.ok) {
      throw new Error(`Upload to IPFS failed: ${response.statusText}`);
    }

    const cid = response.headers.get('Ipfs-Hash');
    log(`Uploaded ${file} to IPFS, CID: ${cid}`);

    return { file, cid };
  }));

  // Update CIDs in bot.yml.
  const botConfig = await readFile(BOT_CONFIG_FILENAME);

  uploads.forEach(upload => {
    const [platform, arch] = path.parse(upload.file).name.split('-');
    set(botConfig, `package.${platform}.${arch}["/"]`, upload.cid);
  });

  botConfig.version = semverInc(botConfig.version, 'patch');
  await writeFile(botConfig, BOT_CONFIG_FILENAME);

  log('Package contents have changed.');
  return botConfig;
};
