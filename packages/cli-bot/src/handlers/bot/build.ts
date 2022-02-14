//
// Copyright 2020 DXOS.org
//

import { Argv } from 'yargs';

// eslint-disable-next-line
import { buildBot } from '@dxos/botkit/dist/src/botkit';
import { CoreOptions } from '@dxos/cli-core';
export interface BotBuildOptions extends CoreOptions {
  entryPoint: string,
  outfile: string
}

export const botBuildOptions = (yargs: Argv<CoreOptions>): Argv<BotBuildOptions> => {
  return yargs
    .option('entryPoint', { type: 'string' })
    .demandOption('entryPoint')
    .option('outfile', { type: 'string' })
    .demandOption('outfile');
};

export const build = () => async (argv: BotBuildOptions) => {
  const { entryPoint, outfile } = argv;
  await buildBot({ entryPoint, outfile });
};
