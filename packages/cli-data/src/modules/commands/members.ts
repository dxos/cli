//
// Copyright 2020 DXOS.org
//

import { Arguments, CommandModule } from 'yargs';

import { print } from '@dxos/cli-core';

import { StateManager } from '../../state-manager';
import { PartyOptions } from '../party';

export const membersCommand = (stateManager: StateManager): CommandModule => ({
  command: ['members'],
  describe: 'List party members.',
  builder: yargs => yargs,

  handler: async (argv: Arguments<PartyOptions>) => {
    const { json } = argv;

    const members = stateManager.party?.queryMembers().value ?? [];

    const data = Array.from(members).filter(Boolean);
    print(data, { json });
    return data;
  }
});
