//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { PAD_TYPE } from '../config';
import { build, publish, register, query } from '../handlers';

/**
 * @param {object} config
 * @param {string} namespace
 */
const getPadRecord = (config, namespace) => {
  const record = {
    id: `${PAD_TYPE}:${config.name}`,
    type: PAD_TYPE,
    ...config
  };

  if (namespace) {
    record.tag = namespace;
  }

  return record;
};

/**
 * App CLI module.
 */
export const AppModule = ({ config }) => {
  return ({
    command: ['pad'],
    describe: 'Pad CLI.',
    builder: yargs => yargs

    // Build app.
      .command({
        command: ['build'],
        describe: 'Build Pad.',
        builder: yargs => yargs,
        handler: asyncHandler(build(config, { getPadRecord }))
      })

    // Publish pad.
      .command({
        command: ['publish'],
        describe: 'Publish Pad to IPFS.',
        builder: yargs => yargs
          .option('path', { type: 'string' }),
        handler: asyncHandler(publish(config))
      })

    // Register pad.
      .command({
        command: ['register'],
        describe: 'Register Pad.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'string' })
          .option('version', { type: 'string' })
          .option('id', { type: 'string' })
          .option('namespace', { type: 'string' }),

        handler: asyncHandler(register(config, { getPadRecord }))
      })

    // Deploy pad.
      .command({
        command: ['deploy'],
        describe: 'Deploy Pad to WNS.',
        builder: yargs => yargs
          .strict(false)
          .version(false),
        handler: asyncHandler(async argv => {
          log('Preparing to deploy...');
          await build(config, { getPadRecord })(argv);
          await publish(config)(argv);
          await register(config, { getPadRecord })(argv);
          log('Done');
        })
      })

    // Query pads.
      .command({
        command: ['query'],
        describe: 'Query pads.',
        builder: yargs => yargs
          .option('id')
          .option('name')
          .option('namespace'),

        handler: asyncHandler(query(config))
      })
  });
};
