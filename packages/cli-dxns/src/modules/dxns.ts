//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

export const DXNSModule = () => ({
  command: ['dxns'],
  describe: 'DXNS operations.',
  builder: (yargs: Argv) => yargs
    .command({
      command: ['test'],
      describe: 'Test DXNS command.',

      handler: asyncHandler(async () => {
      })
    })
});
