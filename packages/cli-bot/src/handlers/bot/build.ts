//
// Copyright 2020 DXOS.org
//

import { buildBot } from '@dxos/botkit/dist/src/botkit';

export const build = () => async(argv: any) => {
  const { entryPoint, outfile } = argv;
  await buildBot({ entryPoint, outfile });
}
