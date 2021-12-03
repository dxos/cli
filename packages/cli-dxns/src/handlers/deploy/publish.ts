//
// Copyright 2021 DXOS.org
//

import cliProgress from 'cli-progress';
import folderSize from 'get-folder-size';
import { ClientOptions } from 'ipfs-http-client/src/lib/core';
import path from 'path';
import pify from 'pify';

import { log } from '@dxos/debug';

import { loadConfig } from '../../utils/config';
import { uploadToIPFS } from '../../utils/ipfs-upload';

const getFolderSize = pify(folderSize);

const DEFAULT_DIST_PATH = 'dist';

interface PublishParams {
  verbose?: boolean,
  timeout?: ClientOptions['timeout'],
  path?: string
}

export const publish = (config: any) => async ({ verbose, timeout, path: distPath = DEFAULT_DIST_PATH }: PublishParams): Promise<string> => {
  const conf = await loadConfig();

  verbose && log(`Publishing ${conf.values.module?.name}...`);

  const publishFolder = path.join(process.cwd(), /* conf.values.build?.out || */ distPath);

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
