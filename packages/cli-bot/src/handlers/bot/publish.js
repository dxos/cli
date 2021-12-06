//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import set from 'lodash.set';
import path from 'path';
import semverInc from 'semver/functions/inc';

import { BUILD_PATH, publishBot } from '@dxos/botkit';

import { getBotConfig, updateBotConfig } from '../../config';

export const publish = config => async () => {
  let ipfsEndpoint = config.get('runtime.services.ipfs.gateway');
  assert(ipfsEndpoint, 'Invalid IPFS Gateway.');

  if (!ipfsEndpoint.endsWith('/')) {
    ipfsEndpoint = `${ipfsEndpoint}/`;
  }

  const buildPath = path.join(process.cwd(), BUILD_PATH, 'node');

  const cid = await publishBot(ipfsEndpoint, buildPath);

  // Update CIDs in bot.yml.
  const botConfig = await getBotConfig();

  set(botConfig, 'package.node["/"]', cid);

  botConfig.version = semverInc(botConfig.version, 'patch');
  await updateBotConfig(botConfig);
};
