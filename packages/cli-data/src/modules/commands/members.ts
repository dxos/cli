//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';

export const membersCommand = (stateManager: StateManager): CommandModule => ({
  command: ['members'],
  describe: 'List party members.',
  builder: yargs => yargs,

  handler: async (argv: any) => {
    const { json } = argv;

    const members = stateManager.party?.queryMembers().value ?? [];

    const data = Array.from(members).filter(Boolean);
    print(data, { json });
    return data;
  }
});
