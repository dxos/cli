//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { encodeObjToBase64, decodeBase64ToObj } from '@dxos/client';
import { asyncHandler } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const PaymentModule = ({ paymentClient }) => ({
  command: ['payment'],
  describe: 'Payment CLI.',
  builder: yargs => yargs
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
            const address = await paymentClient.getWalletAddress();
            log(JSON.stringify({ address }, undefined, 2));
          })
        })

        .command({
          command: ['balance'],
          describe: 'Get wallet balance.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const balance = await paymentClient.getWalletBalance();
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

            const txReceipt = await paymentClient.sendFunds(address, amount);
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
            const info = await paymentClient.connect();
            log(JSON.stringify(info, undefined, 2));
          })
        })

        .command({
          command: ['info'],
          describe: 'Payment server info.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true }),

          handler: asyncHandler(async () => {
            const info = await paymentClient.getNodeInfo();
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
            const channels = await paymentClient.listChannels();
            log(JSON.stringify(channels, undefined, 2));
          })
        })

        .command({
          command: ['info [channel]'],
          describe: 'Payment channel info.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel } = argv;

            const info = await paymentClient.getChannelInfo(channel);
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

            const channel = await paymentClient.setupChannel(counterparty);
            log(JSON.stringify(channel, undefined, 2));
          })
        })

        .command({
          command: ['balances [channel]'],
          describe: 'View channel balances.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel } = argv;

            assert(channel, 'Invalid channel address.');

            const balances = await paymentClient.getChannelBalances(channel);
            log(JSON.stringify(balances, undefined, 2));
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

            await paymentClient.addFunds(channel, amount);
          })
        })

        .command({
          command: ['reconcile [channel]'],
          describe: 'Reconcile deposited funds into the off-chain channel balance.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel } = argv;

            assert(channel, 'Invalid channel address.');

            await paymentClient.reconcileDeposit(channel);
          })
        })

        .command({
          command: ['withdraw [channel] [amount]'],
          describe: 'Withdraw funds from the channel.',
          builder: yargs => yargs
            .option('interactive', { hidden: true, default: true })
            .option('channel', { type: 'string' })
            .option('amount', { type: 'string' }),

          handler: asyncHandler(async (argv) => {
            const { channel, amount } = argv;

            assert(channel, 'Invalid channel address.');
            assert(amount, 'Invalid amount.');

            await paymentClient.withdrawFunds(channel, amount);
          })
        })
    })

    .command({
      command: ['create [channel] [amount]'],
      describe: 'Create payment coupon.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('channel', { type: 'string' })
        .option('amount', { type: 'string' }),

      handler: asyncHandler(async (argv) => {
        const { channel, amount } = argv;

        assert(channel, 'Invalid channel address.');
        assert(amount, 'Invalid amount.');

        const transfer = await paymentClient.createTransfer(channel, amount);
        log(encodeObjToBase64(transfer));
      })
    })

    .command({
      command: ['redeem [coupon]'],
      describe: 'Create payment coupon.',
      builder: yargs => yargs
        .option('interactive', { hidden: true, default: true })
        .option('coupon', { type: 'string' }),

      handler: asyncHandler(async (argv) => {
        const { coupon } = argv;

        await paymentClient.redeemTransfer(decodeBase64ToObj(coupon));
      })
    })
});
