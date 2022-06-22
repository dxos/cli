//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import cliProgress from 'cli-progress';
import fs from 'fs';
import folderSize from 'get-folder-size';
// eslint-disable-next-line
import { ClientOptions } from 'ipfs-http-client/src/lib/core';
import { join } from 'path';
import pify from 'pify';

import type { Config } from '@dxos/config';
import { log } from '@dxos/debug';

import { PackageModule } from '../../utils/config';
import { uploadToIPFS } from '../../utils/ipfs-upload';

const DEFAULT_OUTDIR = 'out';

const getFolderSize = pify(folderSize);

/**
 * Encodes DXN string to fs path.
 *
 * Example: `example:app/braneframe` => `example/app/braneframe`
 */
const encodeName = (name: string) => name.replaceAll(':', '/');

export interface PublishParams {
  config: Config,
  module: PackageModule
}

interface PublishArgs {
  verbose?: boolean,
  pin?: boolean,
  timeout?: ClientOptions['timeout'],
  path?: string
  config?: string
}

export const publish = ({ config, module }: PublishParams) => async ({ verbose, timeout, path, pin }: PublishArgs): Promise<string> => {
  assert(module.name, 'Module name is required to publish.');
  verbose && log(`Publishing ${module.name}...`);

  const moduleOut = `out/${encodeName(module.name)}`;
  const outdir = path ?? module.build?.outdir ?? (fs.existsSync(moduleOut) ? moduleOut : DEFAULT_OUTDIR);
  const publishFolder = join(process.cwd(), outdir);
  const total = await getFolderSize(publishFolder);
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  const cid = await uploadToIPFS(config, publishFolder, {
    timeout: timeout || '10m',
    pin,
    progress: (bytes: any) => bar.update(bytes)
  });

  bar.update(total);
  bar.stop();

  verbose && log(`Published ${module.name} with cid ${cid}`);

  return cid;
};
