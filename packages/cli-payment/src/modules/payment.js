//
// Copyright 2020 DXOS.org
//

// import assert from 'assert';
// import path from 'path';
// import queryString from 'query-string';
import pino from 'pino';
import { RestServerNodeService } from '@connext/vector-utils';

import { keyToString } from '@dxos/crypto';
import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const PaymentModule = ({ stateManager }) => ({
  command: ['payment'],
  describe: 'Payment CLI.',
  builder: yargs => yargs

    .command({
      command: ['init'],
      describe: 'Init payments.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true }),

      handler: asyncHandler(async () => {
        const party = await stateManager.createParty();
        log(JSON.stringify({ partyKey: keyToString(party.key) }, null, 2));

        const alice = await RestServerNodeService.connect('http://localhost:8003', { 1337: 'http://localhost:8545' }, pino());
        const res = await alice.createNode({ index: 0 });
        if (res.isError) {
          log(res.getError());

          return;
        }

        const { publicIdentifier } = res.getValue();
        log(JSON.stringify({ publicIdentifier }, null, 2));
      })
    })

    // Current party.
    .command({
      command: ['current'],
      describe: 'Current party.',
      builder: yargs => yargs,

      handler: asyncHandler(async () => {
        log(JSON.stringify({ currentParty: stateManager.currentParty }, null, 2));
      })
    })
});
