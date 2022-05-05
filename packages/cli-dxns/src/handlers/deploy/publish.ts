//
// Copyright 2021 DXOS.org
//

import cliProgress from 'cli-progress';
import folderSize from 'get-folder-size';
// eslint-disable-next-line
import { ClientOptions } from 'ipfs-http-client/src/lib/core';
import path from 'path';
import pify from 'pify';

import type { Config } from '@dxos/config';
import { log } from '@dxos/debug';

import { PackageModule } from '../../utils/config';
import { uploadToIPFS } from '../../utils/ipfs-upload';

const getFolderSize = pify(folderSize);

export interface PublishParams {
  config: Config,
  module: PackageModule
}

interface PublishArgs {
  verbose?: boolean,
  timeout?: ClientOptions['timeout'],
  path?: string
  config?: string
}

export const publish = ({ config, module }: PublishParams) => async ({ verbose, timeout, path: distPath }: PublishArgs): Promise<string> => {
  verbose && log(`Publishing ${module?.name}...`);

  const publishFolder = path.join(process.cwd(), distPath || module.build!.outdir!);

  const total = await getFolderSize(publishFolder);
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  const cid = await uploadToIPFS(config, publishFolder, {
    timeout: timeout || '10m',
    progress: (bytes: any) => bar.update(bytes)
  });

  bar.update(total);
  bar.stop();

  verbose && log(`Published ${module?.name} with cid ${cid}`);

  return cid;
};
