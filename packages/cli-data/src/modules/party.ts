//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { StateManager } from '../state-manager';
import { createCommand } from './commands/create';
import { infoCommand } from './commands/info';
import { inviteCommand } from './commands/invite';
import { joinCommand } from './commands/join';
import { listCommand } from './commands/list';
import { membersCommand } from './commands/members';
import { openCommand } from './commands/open';

interface Params {
  stateManager: StateManager
}

export const PartyModule = ({ stateManager }: Params) => ({
  command: ['party'],
  describe: 'Party CLI.',
  builder: (yargs: Argv) => yargs
    .option('party-key', {})

    .command(joinCommand(stateManager))
    .command(infoCommand(stateManager))
    .command(openCommand(stateManager))
    .command(listCommand(stateManager))
    .command(createCommand(stateManager))
    .command(membersCommand(stateManager))
    .command(inviteCommand(stateManager))
});
