//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import type { DXNSClient } from '@dxos/cli-dxns';

import { DEFAULT_PORT } from '../config';
import { query, serve, create } from '../handlers';

const DEFAULT_TEMPLATE = 'https://github.com/dxos/templates/tree/main/app-template';

export interface Params {
  config: any,
  getDXNSClient(): Promise<DXNSClient>,
  getReadlineInterface: Function
}

/**
 * App CLI module.
 */
export const AppModule = ({ getDXNSClient, getReadlineInterface, config }: Params) => {
  return ({
    command: ['app'],
    describe: 'App CLI.',
    builder: (yargs: Argv) => yargs
      .option('account', { type: 'string', array: false, describe: 'Optionally override DXNS Account from config.' })

      // Query apps.
      .command({
        command: ['query'],
        describe: 'Query apps.',
        builder: yargs => yargs
          .option('id', {})
          .option('name', {})
          .option('namespace', {})
          // TODO(egorgripasov): Remove.
          .option('dxns', { type: 'boolean', default: false }),

        handler: asyncHandler(query({ getDXNSClient }))
      })

      // Serve apps.
      .command({
        command: ['serve'],
        describe: 'Serve app from WNS.',
        handler: undefined as any,
        builder: (yargs: Argv) => yargs
          // start server.
          .command({
            command: ['start', '$0'],
            describe: 'Start server Applications from WNS.',
            builder: yargs => yargs.version(false)
              .option('namespace', {}) // TODO(burdon): Not used?
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string' })
              .option('daemon', {})
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

            handler: asyncHandler(serve.stop())
          })
      })

      // Create an app from the template.
      .command({
        command: ['create [name]'],
        describe: 'Create app from template.',
        builder: yargs => yargs
          .option('template', { default: DEFAULT_TEMPLATE })
          .option('path', { type: 'string' })
          .option('name', { type: 'string' })
          .option('force', { type: 'boolean' })
          .option('github-token', { type: 'string' }),

        handler: asyncHandler(create({ getReadlineInterface }))
      })
  });
};
