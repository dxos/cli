//
// Copyright 2021 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler, createClientProfile } from '@dxos/cli-core';

// import { log } from '@dxos/debug';

export const HaloModule = () => ({
  command: ['halo'],
  describe: 'HALO operations.',
  builder: (yargs: Argv) => yargs

    .command({
      command: ['init'],
      describe: 'Init halo profile.',

      handler: asyncHandler(async () => {
        await createClientProfile();
      })
    })
});
