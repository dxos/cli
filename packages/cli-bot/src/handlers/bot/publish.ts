//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import cliProgress from 'cli-progress';
import fs from 'fs-extra';
import IpfsHttpClient from 'ipfs-http-client';
import set from 'lodash.set';
import { basename } from 'path';
import semverInc from 'semver/functions/inc';

import { Config } from '@dxos/config';

import { getBotConfig, updateBotConfig } from '../../config';

const updateConfig = async (cid: string) => {
  const botConfig = await getBotConfig();
  set(botConfig, 'package["/"]', cid);

  botConfig.version = semverInc(botConfig.version, 'patch');
  await updateBotConfig(botConfig);
};

export const publish = (config: Config) => async (argv: any) => {
  const { buildPath } = argv;
  assert(buildPath, 'buildPath is required.');

  let ipfsEndpoint = config.get('runtime.services.ipfs.server');
  assert(ipfsEndpoint, 'Invalid IPFS Gateway.');

  if (!ipfsEndpoint.endsWith('/')) {
    ipfsEndpoint = `${ipfsEndpoint}/`;
  }

  const ipfs = IpfsHttpClient({
    url: ipfsEndpoint,
    timeout: '1m'
  });

  const { size: total } = await fs.promises.stat(buildPath);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  // eslint-disable-next-line
  const fileContent = fs.readFileSync(buildPath);
  const addResult = await ipfs.add({
    path: basename(buildPath),
    content: fileContent
  },
  {
    progress: (bytes: any) => bar.update(bytes)
  }
  );

  bar.update(total);
  bar.stop();

  const cid = addResult.cid.toString();
  await updateConfig(cid);
};
