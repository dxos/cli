//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const HaloModule = () => ({
  command: ['halo'],
  describe: 'HALO database.',
  builder: yargs => yargs

    .command({
      command: ['test'],
      describe: 'Test halo command.',

      handler: asyncHandler(async () => {
        log('Test halo cli command.');
      })
    })
});
