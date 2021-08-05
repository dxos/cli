//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { APP_TYPE, DEFAULT_PORT, BASE_URL } from '../config';
import { build, publish, register, query, serve } from '../handlers';

const getPublicUrl = ({ name, version }) => `${BASE_URL}/${name}@${version}`;

/**
 * @param {object} config
 * @param {string} namespace
 */
const getAppRecord = (config, namespace) => {
  const record = {
    ...config,
    type: APP_TYPE
  };

  // TODO(burdon): Tags are obsolete?
  if (namespace) {
    record.tag = namespace;
  }

  return record;
};

/**
 * App CLI module.
 */
export const AppModule = ({ getDXNSClient, config }) => {
  return ({
    command: ['app'],
    describe: 'App CLI.',
    builder: yargs => yargs

      // Build app.
      .command({
        command: ['build'],
        describe: 'Build app.',
        builder: yargs => yargs,

        handler: asyncHandler(build(config, { getAppRecord, getPublicUrl }))
      })

      // Publish app.
      .command({
        command: ['publish'],
        describe: 'Publish app to IPFS.',
        builder: yargs => yargs
          .option('path', { type: 'string' })
          .option('timeout', { type: 'string', default: '10m' }),

        handler: asyncHandler(publish(config))
      })

      // Register app.
      .command({
        command: ['register'],
        describe: 'Register app.',
        builder: yargs => yargs
          .version(false)
          .option('id', { type: 'string' })
          .option('name', { type: 'array' })
          .option('domain', { type: 'string' })
          .option('version', { type: 'string' })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' })
          .option('schema', { type: 'string' })
          // TODO(egorgripasov): Remove.
          .option('dxns', { type: 'boolean', default: false }),

        handler: asyncHandler(register(config, { getAppRecord, getDXNSClient }))
      })

      // Deploy app.
      .command({
        command: ['deploy'],
        describe: 'Build publish and register app.',
        builder: yargs => yargs
          .strict(false)
          .version(false)
          .option('id', { type: 'string' })
          .option('name', { type: 'array' })
          .option('domain', { type: 'string' })
          .option('namespace', { type: 'string' }) // TODO(burdon): Why not required in register above?
          .option('version', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' })
          .option('schema', { type: 'string' })
          .option('timeout', { type: 'string', default: '10m' })
          // TODO(egorgripasov): Remove.
          .option('dxns', { type: 'boolean', default: false }),

        handler: asyncHandler(async argv => {
          log('Preparing to deploy...'); // TODO(burdon): Standardize logging (stages, verbose).
          await build(config, { getAppRecord, getPublicUrl })(argv);
          await publish(config)(argv);
          await register(config, { getAppRecord, getDXNSClient })(argv);
        })
      })

      // Query apps.
      .command({
        command: ['query'],
        describe: 'Query apps.',
        builder: yargs => yargs
          .option('id')
          .option('name')
          .option('namespace')
          // TODO(egorgripasov): Remove.
          .option('dxns', { type: 'boolean', default: false }),

        handler: asyncHandler(query(config, { getDXNSClient }))
      })

      // Serve apps.
      .command({
        command: ['serve'],
        describe: 'Serve app from WNS.',
        builder: yargs => yargs
          // start server.
          .command({
            command: ['start', '$0'],
            describe: 'Start server Applications from WNS.',
            builder: yargs => yargs.version(false)
              .option('namespace') // TODO(burdon): Not used?
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string' })
              .option('daemon')
              .option('port', { type: 'number', default: DEFAULT_PORT })
              .option('auth', { type: 'boolean', default: true }),

            handler: asyncHandler(serve.start(config))
          })

          // Stop server.
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
