//
// Copyright 2020 DxOS.
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { APP_TYPE, DEFAULT_PORT, BASE_URL } from '../config';
import { build, publish, register, query, serve } from '../handlers';

/**
 * @param {object} config
 * @param {string} namespace
 */
const getAppRecord = (config, namespace) => {
  const record = {
    id: `${APP_TYPE}:${config.name}`,
    type: APP_TYPE,
    ...config
  };

  if (namespace) {
    record.tag = namespace;
  }

  return record;
};

const getPublicUrl = ({ name, version }) => `${BASE_URL}/${name}@${version}`;

/**
 * App CLI module.
 */
export const AppModule = ({ config }) => {
  return ({
    command: ['app'],
    describe: 'App CLI.',
    builder: yargs => yargs

    // Build app.
      .command({
        command: ['build'],
        describe: 'Build Application.',
        builder: yargs => yargs,
        handler: asyncHandler(build(config, { getAppRecord, getPublicUrl }))
      })

    // Publish app.
      .command({
        command: ['publish'],
        describe: 'Publish Application to IPFS.',
        builder: yargs => yargs
          .option('path', { type: 'string' }),
        handler: asyncHandler(publish(config))
      })

    // Register app.
      .command({
        command: ['register'],
        describe: 'Register app.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'string' })
          .option('version', { type: 'string' })
          .option('id', { type: 'string' })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' }),
        handler: asyncHandler(register(config, { getAppRecord }))
      })

    // Deploy app.
      .command({
        command: ['deploy'],
        describe: 'Deploy Application to WNS.',
        builder: yargs => yargs
          .strict(false)
          .version(false)
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' }),
        handler: asyncHandler(async argv => {
          log('Preparing to deploy...');
          await build(config, { getAppRecord, getPublicUrl })(argv);
          await publish(config)(argv);
          await register(config, { getAppRecord })(argv);
          log('Done');
        })
      })

    // Query apps.
      .command({
        command: ['query'],
        describe: 'Query apps.',
        builder: yargs => yargs
          .option('id')
          .option('name')
          .option('namespace'),

        handler: asyncHandler(query(config))
      })

    // Serve apps.
      .command({
        command: ['serve'],
        describe: 'Serve Applications from WNS.',
        builder: yargs => yargs
        // start server.
          .command({
            command: ['start', '$0'],
            describe: 'Start server Applications from WNS.',
            builder: yargs => yargs.version(false)
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string' })
              .option('namespace')
              .option('daemon')
              .option('port', { type: 'number', default: DEFAULT_PORT }),

            handler: asyncHandler(serve.start(config))
          })

        // stop server.
          .command({
            command: ['stop'],
            describe: 'Stop Server.',
            builder: yargs => yargs
              .option('proc-name', { type: 'string' }),
            handler: asyncHandler(serve.stop(config))
          })
      })
  });
};
