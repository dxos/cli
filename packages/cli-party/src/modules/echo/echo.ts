//
// Copyright 2022 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';

import { CliDataState } from '../../init';
import { listCommand, createCommand, updateCommand, deleteCommand, restoreCommand } from './commands';

export const EchoModule = ({ stateManager }: CliDataState) => ({
  command: ['echo'],
  describe: 'ECHO database.',
  handler: undefined as any,
  builder: (yargs: Argv<CoreOptions>) => yargs
    .command(listCommand(stateManager))
    .command(createCommand(stateManager))
    .command(updateCommand(stateManager))
    .command(deleteCommand(stateManager))
    .command(restoreCommand(stateManager))
});
