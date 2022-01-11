//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import cliProgress from 'cli-progress';
import fs from 'fs-extra';
import set from 'lodash.set';
import semverInc from 'semver/functions/inc';
import IpfsHttpClient from 'ipfs-http-client';

import { getBotConfig, updateBotConfig } from '../../config';
import { Config, ConfigV1Object } from '@dxos/config';

export const publish = (config: Config<ConfigV1Object>) => async (buildPath: string) => {
  let ipfsEndpoint = config.get('runtime.services.ipfs.gateway');
  assert(ipfsEndpoint, 'Invalid IPFS Gateway.');

  if (!ipfsEndpoint.endsWith('/')) {
    ipfsEndpoint = `${ipfsEndpoint}/`;
  }

  // Update CIDs in bot.yml.
  const botConfig = await getBotConfig();

  const ipfs = IpfsHttpClient({
    url: ipfsEndpoint,
    timeout: '1m'
  });

  const { size: total } = await fs.promises.stat(buildPath);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const addResult = await ipfs.add(buildPath, { progress: (bytes: any) => bar.update(bytes) });

  bar.update(total);
  bar.stop();

  const cid = addResult.cid.toString();

  set(botConfig, 'package.node["/"]', cid);

  botConfig.version = semverInc(botConfig.version, 'patch');
  await updateBotConfig(botConfig);
};
