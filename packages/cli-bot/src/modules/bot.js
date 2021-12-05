//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';

import { spawn, invite, build, publish, register, query } from '../handlers/bot';
import { install, setup, start } from '../handlers/bot-factory';

/**
 * Bot CLI module.
 */
export const BotModule = ({ config, stateManager, /* getReadlineInterface, */ cliState, getDXNSClient }) => {
  return {
    command: ['bot'],
    describe: 'Bot CLI.',
    builder: yargs => yargs

      .command({
        command: ['factory'],
        describe: 'Bot Factory Commands.',
        builder: yargs => yargs
          .command({
            command: ['install', 'upgrade'],
            describe: 'Download & Install @dxos/botkit binary.',
            builder: yargs => yargs.version(false)
              .option('npmClient', { default: config.get('cli.npmClient') })
              .option('dry-run', { type: 'boolean', default: false })
              .option('channel', { default: config.get('cli.botFactory.channel') })
              .option('version'),

            handler: asyncHandler(install(config))
          })

          .command({
            command: ['setup'],
            describe: 'Setup a bot factory.',
            builder: yargs => yargs
              .option('local-dev', { alias: 'd', type: 'boolean', default: false, description: 'Local development mode' })
              .option('reset', { type: 'boolean', default: false, description: 'Remove previously spawned bots' })
              .option('topic', { alias: 't', type: 'string' })
              .option('secret-key', { alias: 's', type: 'string' }),

            handler: asyncHandler(setup(config))
          })

          .command({
            command: ['start'],
            describe: 'Run a bot factory.',
            builder: yargs => yargs
              .option('local-dev', { alias: 'd', type: 'boolean', default: false, description: 'Local development mode' })
              .option('reset', { type: 'boolean', default: false, description: 'Remove previously spawned bots' })
              .option('topic', { alias: 't', type: 'string' })
              .option('secret-key', { alias: 's', type: 'string' })
              .option('single-instance', { type: 'boolean', default: false })
              .option('detached', { type: 'boolean', alias: 'daemon', default: false })
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string' }),

            handler: asyncHandler(async argv => {
              await setup(config, { includeNodePath: true })(argv);
              await start(config)(argv);
            })
          })
      })

      .command({
        command: ['spawn'],
        describe: 'Spawn new bot instance.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('env', { type: 'string' })
          .option('ipfsCID', { type: 'string' })
          .option('ipfsEndpoint', { type: 'string' })
          .option('id', { type: 'string' })
          .option('name', { type: 'string' })
          .option('bot-name', { type: 'string' })
          .option('bot-path', { type: 'string' }),

        handler: asyncHandler(spawn({ cliState, stateManager }))
      })

      .command({
        command: ['invite'],
        describe: 'Invite bot to a party.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('bot-id', { type: 'string' })
          .option('spec', { alias: 's', type: 'json' })
          .option('env', { type: 'string' })
          .option('ipfsCID', { type: 'string' })
          .option('ipfsEndpoint', { type: 'string' })
          .option('id', { type: 'string' })
          .option('name', { type: 'string' })
          .option('bot-name', { type: 'string' })
          .option('bot-path', { type: 'string' }),

        handler: asyncHandler(invite({ stateManager }))
      })

      .command({
        command: ['build'],
        describe: 'Build bot.',
        builder: yargs => yargs,

        handler: asyncHandler(build())
      })

      .command({
        command: ['publish'],
        describe: 'Publish Bot to IPFS.',
        builder: yargs => yargs,

        handler: asyncHandler(publish(config))
      })

      .command({
        command: ['register'],
        describe: 'Register bot in DXNS.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'array' })
          .option('version', { type: 'string' })
          .option('domain', { type: 'string' }),

        handler: asyncHandler(register({ getDXNSClient }))
      })

      .command({
        command: ['query'],
        describe: 'Query bots',
        builder: yargs => yargs,

        handler: asyncHandler(query({ getDXNSClient }))
      })
  };
};
