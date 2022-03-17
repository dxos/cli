//
// Copyright 2021 DXOS.org
//

import cliProgress from 'cli-progress';
import folderSize from 'get-folder-size';
// eslint-disable-next-line
import { ClientOptions } from 'ipfs-http-client/src/lib/core';
import path from 'path';
import pify from 'pify';

import { log } from '@dxos/debug';

import { loadConfig } from '../../utils/config';
import { uploadToIPFS } from '../../utils/ipfs-upload';

const getFolderSize = pify(folderSize);

const DEFAULT_DIST_PATH = 'out';

interface PublishParams {
  verbose?: boolean,
  timeout?: ClientOptions['timeout'],
  path?: string
  config?: string
}

export const publish = (config: any) => async ({ verbose, timeout, path: distPath, config: configPath }: PublishParams): Promise<string> => {
  const conf = await loadConfig(configPath);

  verbose && log(`Publishing ${conf.values.module?.name}...`);

  const publishFolder = path.join(process.cwd(), distPath || conf.values.build?.out || DEFAULT_DIST_PATH);

  const total = await getFolderSize(publishFolder);
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  const cid = await uploadToIPFS(config, publishFolder, {
    timeout: timeout || '10m',
    progress: (bytes: any) => bar.update(bytes)
  });

  bar.update(total);
  bar.stop();

  verbose && log(`Published ${conf.values.module?.name} with cid ${cid}`);

  return cid;
};
