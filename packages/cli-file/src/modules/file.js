//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { publish, register, query, download } from '../handlers';

/**
 * App CLI module.
 */
export const AppModule = ({ config }) => {
  return ({
    command: ['file'],
    describe: 'File CLI',
    builder: yargs => yargs

      // Download a file.
      .command({
        command: ['download'],
        describe: 'Download File from IPFS.',
        builder: yargs => yargs
          .option('quiet', { type: 'boolean', default: false })
          .option('name', { type: 'string', required: false })
          .option('id', { type: 'string', required: false })
          .option('out', { type: 'string', default: '.' })
          .option('timeout', { type: 'string', default: '20m' }),
        handler: asyncHandler(download(config))
      })

      // Publish file.
      .command({
        command: ['publish'],
        describe: 'Publish File to IPFS.',
        builder: yargs => yargs
          .option('quiet', { type: 'boolean', default: false })
          .option('path', { type: 'string', required: true })
          .option('timeout', { type: 'string', default: '20m' }),
        handler: asyncHandler(publish(config))
      })

      // Register file.
      .command({
        command: ['register'],
        describe: 'Register file.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'array', required: true })
          .option('cid', { type: 'string', required: true })
          .option('fileName', { type: 'string' })
          .option('contentType', { type: 'string' })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' }),
        handler: asyncHandler(register(config))
      })

      // Deploy files.
      .command({
        command: ['deploy'],
        describe: 'Deploy File to WNS.',
        builder: yargs => yargs
          .strict(false)
          .version(false)
          .option('path', { type: 'string', required: true })
          .option('name', { type: 'array', required: true })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' })
          .option('timeout', { type: 'string', default: '20m' }),
        handler: asyncHandler(async argv => {
          log('Preparing to deploy...');
          const result = await publish(config)(argv);
          await register(config)({ ...argv, ...result });
          log('Done');
        })
      })

      // Query files.
      .command({
        command: ['query'],
        describe: 'Query files.',
        builder: yargs => yargs
          .option('id')
          .option('name')
          .option('namespace'),

        handler: asyncHandler(query(config))
      })

  });
};
