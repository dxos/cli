//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler, CoreState } from '@dxos/cli-core';
import type { StateManager } from '@dxos/cli-data';
import type { DXNSClient } from '@dxos/cli-dxns';

import {
  publish,
  query,
  register,
  build,
  botBuildOptions,
  botRegisterOptions,
  botSpawnOptions,
  spawn
} from '../handlers/bot';
import {
  botFactoryStartOptions,
  botFactoryInstallOptions,
  install,
  setup,
  start,
  botFactorySetupOptions,
  botFactoryStopOptions,
  stop
} from '../handlers/bot-factory';

export interface Params {
  config: any,
  getDXNSClient(): Promise<DXNSClient>,
  stateManager: StateManager,
  cliState: CoreState['cliState']
}

/**
 * Bot CLI module.
 */
export const BotModule = ({ config, getDXNSClient, stateManager }: Params) => {
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
            builder: botFactoryInstallOptions(config),
            handler: asyncHandler(install())
          })

          .command({
            command: ['setup'],
            describe: 'Setup a bot factory.',
            builder: botFactorySetupOptions(config),
            handler: asyncHandler(setup(config))
          })

          .command({
            command: ['start'],
            describe: 'Run a bot factory.',
            builder: botFactoryStartOptions,

            handler: asyncHandler(async (argv: any) => {
              await setup(config, { includeNodePath: true })(argv);
              await start()(argv);
            })
          })

          .command({
            command: ['stop'],
            describe: 'stop a bot factory.',
            builder: botFactoryStopOptions,

            handler: asyncHandler(stop())
          })
      })

      .command({
        command: ['spawn'],
        describe: 'Spawn new bot instance.',
        builder: botSpawnOptions,

        handler: asyncHandler(spawn({ stateManager, config }))
      })

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
        builder: botRegisterOptions,

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
        builder: botBuildOptions,

        handler: asyncHandler(build())
      })
  };
};
