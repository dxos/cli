//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { getFreeDomain, listDomains } from '../../handlers/domain';
import { Params } from '../../interfaces';

export const domainCommand = (params: Params): CommandModule => ({
  command: ['domain'],
  describe: 'Domain commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['list'],
      describe: 'List domains.',
      handler: asyncHandler(listDomains(params))
    })

    .command({
      command: ['create'],
      describe: 'Create free domain.',
      handler: asyncHandler(getFreeDomain(params))
    })
});
