//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';

import { asyncHandler, print, listServices, getLogs, restartService, stopService } from '@dxos/cli-core';

/**
 * Services CLI module.
 * @returns {object}
 */
export const ServicesModule = () => ({
  command: ['service', 'services'],
  describe: 'Services.',

  handler: asyncHandler(async argv => {
    const { json } = argv;
    const { services } = await listServices();
    print(services, { json });
  }),

  builder: yargs => yargs
    // Get logs.
    .command({
      command: ['logs [name]'],
      describe: 'Fetch logs.',
      builder: yargs => yargs
        .option('name')
        .option('lines', { type: 'number' })
        .option('follow', { alias: 'f', type: 'boolean' })
        .option('log-file')
        .option('running-only', { default: false }),

      handler: asyncHandler(async argv => {
        const { name, lines, runningOnly, logFile, follow } = argv;

        assert(name, 'Invalid Process Name.');
        await getLogs(name, { lines, runningOnly, logFile, follow });
      })
    })

    // Restart.
    .command({
      command: ['restart [name]'],
      describe: 'Restart serice.',
      builder: yargs => yargs
        .option('name'),

      handler: asyncHandler(async argv => {
        const { name } = argv;

        assert(name, 'Invalid Process Name.');
        await restartService(name);
      })
    })

    // Stop.
    .command({
      command: ['stop [name]'],
      describe: 'Stop service.',
      builder: yargs => yargs
        .option('name'),

      handler: asyncHandler(async argv => {
        const { name } = argv;

        assert(name, 'Invalid Process Name.');
        await stopService(name);
      })
    })
});
