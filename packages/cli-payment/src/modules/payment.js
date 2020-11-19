//
// Copyright 2020 DXOS.org
//

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const PaymentModule = ({ paymentManager }) => ({
  command: ['payment'],
  describe: 'Payment CLI.',
  builder: yargs => yargs
    .option('server', { type: 'string' })
    .option('interactive', { hidden: true, default: true })

    .command({
      command: ['server'],
      describe: 'Payment server operations.',
      builder: yargs => yargs
        .command({
          command: ['connect'],
          describe: 'Connect to the payment channel server.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const info = await paymentManager.getInfo();
            log(JSON.stringify(info, undefined, 2));
          })
        })
    })

    .command({
      command: ['wallet'],
      describe: 'Wallet operations.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true }),

      handler: asyncHandler(async () => {

      })
    })

    .command({
      command: ['channel'],
      describe: 'Payment channel operations.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })

        .command({
          command: ['setup'],
          describe: 'Setup payment channel with counterparty.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('counterparty-id', { alias: 'id', type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { id } = argv;
            const channel = await paymentManager.setupChannel(id);
            log(JSON.stringify(channel, undefined, 2));
          })
        })
    })
});
