//
// Copyright 2021 DXOS.org
//

import path from 'path';

import { Runnable } from '@dxos/cli-core';

export const assemble = () => async ({ dev }) => {
  const scriptRunnable = new Runnable(path.join(__dirname, '../../../scripts/install.sh'));
  const options = {
    detached: false
  };

  // eslint-disable-next-line
  scriptRunnable.run([dev ? '1' : '0'], options);
};
