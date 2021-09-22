//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';

import { CliDataState } from '../../init';
import { createCommand, infoCommand, inviteCommand, joinCommand, listCommand, membersCommand, openCommand } from './commands';

export interface PartyOptions extends CoreOptions {
  partyKey?: string
}

const partyOptions = (yargs: Argv<CoreOptions>): Argv<PartyOptions> => {
  return yargs
    .option('party-key', { type: 'string' });
};

export const PartyModule = ({ stateManager }: CliDataState) => ({
  command: ['party'],
  describe: 'Party CLI.',
  handler: undefined as any,
  builder: (yargs: Argv<CoreOptions>) => partyOptions(yargs)
    .command(joinCommand(stateManager))
    .command(infoCommand(stateManager))
    .command(openCommand(stateManager))
    .command(listCommand(stateManager))
    .command(createCommand(stateManager))
    .command(membersCommand(stateManager))
    .command(inviteCommand(stateManager))
});
