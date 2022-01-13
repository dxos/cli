//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';
import type { DXNSClient } from '@dxos/cli-dxns';

// import { spawn, invite, build, publish, register, query } from '../handlers/bot';
import { publish, query, register, build } from '../handlers/bot';
import { install, setup, start } from '../handlers/bot-factory';

export interface Params {
  config: any,
  getDXNSClient(): Promise<DXNSClient>
}

/**
 * Bot CLI module.
 */
export const BotModule = ({ config, getDXNSClient }: Params) => {
  return {
    command: ['bot'],
    describe: 'Bot CLI.',
    builder: (yargs: Argv) => yargs

      .command({
        handler: () => {},
        command: ['factory'],
        describe: 'Bot Factory Commands.',
        builder: (yargs: Argv) => yargs
          .command({
            command: ['install', 'upgrade'],
            describe: 'Download & Install @dxos/botkit binary.',
            builder: (yargs: Argv) => yargs.version(false)
              .option('npmClient', { default: config.get('runtime.cli.npmClient') })
              .option('dry-run', { type: 'boolean', default: false })
              .option('channel', { default: config.get('runtime.cli.botFactory.channel') })
              .option('version', { type: 'string' }),
            handler: asyncHandler(install())
          })

          .command({
            command: ['setup'],
            describe: 'Setup a bot factory.',
            builder: (yargs: Argv) => yargs,
            handler: asyncHandler(setup(config))
          })

          .command({
            command: ['start'],
            describe: 'Run a bot factory.',
            builder: (yargs: Argv) => yargs
              .option('single-instance', { type: 'boolean', default: false })
              .option('detached', { type: 'boolean', alias: 'daemon', default: false })
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string' }),

            handler: asyncHandler(async (argv: any) => {
              await setup(config, { includeNodePath: true })(argv);
              await start()(argv);
            })
          })
      })

    // .command({
    //   command: ['spawn'],
    //   describe: 'Spawn new bot instance.',
    //   builder: yargs => yargs
    //     .option('topic', { alias: 't', type: 'string' })
    //     .option('env', { type: 'string' })
    //     .option('ipfsCID', { type: 'string' })
    //     .option('ipfsEndpoint', { type: 'string' })
    //     .option('id', { type: 'string' })
    //     .option('name', { type: 'string' })
    //     .option('bot-name', { type: 'string' })
    //     .option('bot-path', { type: 'string' }),

    //   handler: asyncHandler(spawn({ cliState, stateManager }))
    // })

    // .command({
    //   command: ['invite'],
    //   describe: 'Invite bot to a party.',
    //   builder: yargs => yargs
    //     .option('topic', { alias: 't', type: 'string' })
    //     .option('bot-id', { type: 'string' })
    //     .option('spec', { alias: 's', type: 'json' })
    //     .option('env', { type: 'string' })
    //     .option('ipfsCID', { type: 'string' })
    //     .option('ipfsEndpoint', { type: 'string' })
    //     .option('id', { type: 'string' })
    //     .option('name', { type: 'string' })
    //     .option('bot-name', { type: 'string' })
    //     .option('bot-path', { type: 'string' }),

    //   handler: asyncHandler(invite({ stateManager }))
    // })

    // .command({
    //   command: ['build'],
    //   describe: 'Build bot.',
    //   builder: yargs => yargs,

    //   handler: asyncHandler(build())
    // })

      .command({
        command: ['publish'],
        describe: 'Publish Bot to IPFS.',
        builder: yargs => yargs
          .option('buildPath', { type: 'string' })
          .demandOption('buildPath'),

        handler: asyncHandler(publish(config))
      })

      .command({
        command: ['register'],
        describe: 'Register bot in DXNS.',
        builder: yargs => yargs
          .version(false)
          .option('version', { type: 'string' })
          .option('name', { type: 'string' })
          .option('domain', { type: 'string' })
          .demandOption('name')
          .demandOption('domain'),

        handler: asyncHandler(register({ getDXNSClient }))
      })

      .command({
        command: ['query'],
        describe: 'Query bots',
        builder: yargs => yargs,

        handler: asyncHandler(query({ getDXNSClient }))
      })

      .command({
        command: ['build'],
        describe: 'Build bot',
        builder: yargs => yargs
          .option('entryPoint', { type: 'string' })
          .demandOption('entryPoint')
          .option('outfile', { type: 'string' })
          .demandOption('outfile'),

        handler: asyncHandler(build())
      })
  };
};
