//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler, CoreState } from '@dxos/cli-core';
import type { DXNSClient } from '@dxos/cli-dxns';
import type { StateManager } from '@dxos/cli-party';

import {
  query,
  spawn,
  list,
  botStart,
  botStop,
  botRemove,
  botLogs,
  botSpawnOptions,
  botListOptions,
  botStartOptions,
  botStopOptions,
  botRemoveOptions,
  botLogsOptions
} from '../handlers/bot';
import {
  botFactoryStartOptions,
  botFactorySwarmOptions,
  botFactoryInstallOptions,
  install,
  setup,
  start,
  swarm,
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
      .option('account', { type: 'string', array: false, describe: 'Optionally override DXNS Account from config.' })

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
            command: ['swarm'],
            describe: 'Swarm with a bot factory.',
            builder: botFactorySwarmOptions,
            handler: asyncHandler(swarm(config))
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

      .command({
        command: ['query'],
        describe: 'Query bots.',
        builder: yargs => yargs,

        handler: asyncHandler(query({ getDXNSClient }))
      })

      .command({
        command: ['list'],
        describe: 'List all bots in bot factory.',
        builder: botListOptions,

        handler: asyncHandler(list({ config }))
      })

      .command({
        command: ['start <botId>'],
        describe: 'Start bot.',
        builder: botStartOptions,

        handler: asyncHandler(botStart({ config }))
      })

      .command({
        command: ['stop <botId>'],
        describe: 'Stop bot.',
        builder: botStopOptions,

        handler: asyncHandler(botStop({ config }))
      })

      .command({
        command: ['remove <botId>'],
        describe: 'Remove bot from a bot factory.',
        builder: botRemoveOptions,

        handler: asyncHandler(botRemove({ config }))
      })

      .command({
        command: ['logs <botId>'],
        describe: 'Get logs of a bot.',
        builder: botLogsOptions,

        handler: asyncHandler(botLogs({ config }))
      })
  };
};
