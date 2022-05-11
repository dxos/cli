//
// Copyright 2022 DXOS.org
//

import yargs from 'yargs';

export const InfoModule = () => ({
  command: ['info'],
  describe: 'CLI basic information.',
  handler: () => {
    yargs.showVersion(version => {
      console.log({
        root: __dirname,
        version,
        argv: yargs.argv
      });
    });
  }
});
