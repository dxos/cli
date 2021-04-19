//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { asyncHandler, print, DockerContainer } from '@dxos/cli-core';

const DEFAULT_LOG_LINES = 100;

/**
 * Container CLI module.
 * @returns {object}
 */
export const ContainerModule = () => ({
  command: ['container'],
  describe: 'New KUBE service management.',

  builder: yargs => yargs
    // List.
    .command({
      command: ['list'],
      describe: 'List serice.',
      builder: yargs => yargs
        .option('name'),

      handler: asyncHandler(async argv => {
        const { json } = argv;

        const containers = await DockerContainer.list();
        print(await Promise.all(containers.map(async container => ({
          name: container.name,
          state: container.state,
          ports: container.ports.filter(port => port.PublicPort).map(port => port.PublicPort).join(','),
          ...(await container.stats())
        }))), { json });
      })
    })

    .command({
      command: ['logs [name]'],
      describe: 'Fetch logs.',
      builder: yargs => yargs
        .option('name')
        .option('lines', { alias: 'tail', type: 'number', default: DEFAULT_LOG_LINES })
        .option('follow', { alias: 'f', type: 'boolean', default: false }),

      handler: asyncHandler(async argv => {
        const { name, lines, follow } = argv;

        assert(name, 'Invalid Process Name.');

        const container = await DockerContainer.find({ name });
        if (!container) {
          throw new Error(`Unable to find "${name}" service.`);
        }
        await container.logs(lines, follow);
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

        const container = await DockerContainer.find({ name });
        if (!container) {
          throw new Error(`Unable to find "${name}" service.`);
        }
        await container.stop();
      })
    })
});
