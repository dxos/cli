//
// Copyright 2021 DXOS.org
//

import { Argv } from 'yargs';

import { CoreOptions, stopService } from '@dxos/cli-core';

import { BOT_FACTORY_PROCESS_NAME } from './start';

export interface BotFactoryStopOptions extends CoreOptions {
  'proc-name'?: string
}

export const botFactoryStopOptions = (yargs: Argv<CoreOptions>): Argv<BotFactoryStopOptions> => {
  return yargs
    .option('proc-name', { type: 'string' });
};

export interface StopOptions {
  procName?: string
}

export const stop = () => async ({
  procName = BOT_FACTORY_PROCESS_NAME
}: StopOptions) => {
  await stopService(procName);
};
