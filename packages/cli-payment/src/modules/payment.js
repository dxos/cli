//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const PaymentModule = ({ paymentManager }) => ({
  command: ['payment'],
  describe: 'Payment CLI.',
  builder: yargs => yargs
    .option('server', { type: 'string' })
    .option('interactive', { hidden: true, default: true })

    .command({
      command: ['wallet'],
      describe: 'Wallet operations.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })

        .command({
          command: ['address'],
          describe: 'Get wallet address.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const address = await paymentManager.getWalletAddress();
            log(JSON.stringify({ address }, undefined, 2));
          })
        })

        .command({
          command: ['balance'],
          describe: 'Get wallet balance.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const balance = await paymentManager.getWalletBalance();
            log(JSON.stringify({ balance }, undefined, 2));
          })
        })

        .command({
          command: ['send [address] [amount]'],
          describe: 'Send funds using wallet.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('address', { type: 'string' })
            .option('amount', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { address, amount } = argv;

            assert(address, 'Invalid address.');
            assert(amount, 'Invalid amount.');

            const txReceipt = await paymentManager.sendFunds(address, amount);
            log(JSON.stringify(txReceipt, undefined, 2));
          })
        })
    })

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
            const info = await paymentManager.getId();
            log(JSON.stringify(info, undefined, 2));
          })
        })

        .command({
          command: ['info'],
          describe: 'Payment channel server info.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const info = await paymentManager.getNodeInfo();
            log(JSON.stringify(info, undefined, 2));
          })
        })
    })

    .command({
      command: ['channel'],
      describe: 'Payment channel operations.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })

        .command({
          command: ['list'],
          describe: 'List payment channels.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const channels = await paymentManager.listChannels();
            log(JSON.stringify(channels, undefined, 2));
          })
        })

        .command({
          command: ['get [channel]'],
          describe: 'Get payment channel info.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel } = argv;

            const info = await paymentManager.getChannelInfo(channel);
            log(JSON.stringify(info, undefined, 2));
          })
        })

        .command({
          command: ['setup [counterparty]'],
          describe: 'Setup payment channel with counterparty.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async (argv) => {
            const { counterparty } = argv;

            assert(counterparty, 'Invalid counterparty ID.');

            const channel = await paymentManager.setupChannel(counterparty);
            log(JSON.stringify(channel, undefined, 2));
          })
        })

        .command({
          command: ['deposit [channel] [amount]'],
          describe: 'Deposit funds into the channel (initiator only).',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' })
            .option('amount', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel, amount } = argv;

            assert(channel, 'Invalid channel address.');
            assert(amount, 'Invalid amount.');

            await paymentManager.sendDepositTx(channel, amount);
          })
        })
    })
});
