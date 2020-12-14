//
// Copyright 2020 DXOS.org
//

// import assert from 'assert';
// import path from 'path';

import { asyncHandler, print } from '@dxos/cli-core';
// import { log } from '@dxos/debug';
import { humanize } from '@dxos/crypto';

export const EchoModule = ({ stateManager }) => ({
  command: ['echo'],
  describe: 'Echo CLI.',
  builder: yargs => yargs
    .option('echo-key')

    .command({
      command: ['items'],
      describe: 'List echo items.',
      builder: yargs => yargs,

      handler: asyncHandler(async (argv) => {
        const { json } = argv;

        const items = stateManager.party.database.queryItems().value;
        const result = (items || []).map(item => {
          const modelName = Object.getPrototypeOf(item.model).constructor.name;
          return {
            id: humanize(item.id),
            type: item.type,
            modelType: item.model._meta.type,
            modelName
          };
        });
        print(result, { json });
      })
    })
});
