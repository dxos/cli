//
// Copyright 2020 DXOS.org
//

import { CommandModule } from 'yargs';

import { asyncHandler } from '@dxos/cli-core';

import { bidAuction, claimAuction, closeAuction, createAuction, forceCloseAuction, listAuctions } from '../../handlers/auction';
import { Params } from '../../interfaces';

export const auctionCommand = (params: Params): CommandModule => ({
  command: ['auction'],
  describe: 'Auction commands.',
  handler: () => {},
  builder: yargs => yargs
    .command({
      command: ['create <name> <start-amount>'],
      describe: 'Create a new auction.',
      builder: yargs => yargs
        .option('name', { type: 'string' })
        .option('start-amount', { type: 'number' }),

      handler: asyncHandler(createAuction(params))
    })

    .command({
      command: ['bid <name> <amount>'],
      describe: 'Bid on a given name.',
      builder: yargs => yargs
        .option('name', { type: 'string' })
        .option('amount', { type: 'number' }),

      handler: asyncHandler(bidAuction(params))
    })

    .command({
      command: ['close <name>'],
      describe: 'Close an auction after the bidding period.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),

      handler: asyncHandler(closeAuction(params))
    })

    .command({
      command: ['force-close <name>'],
      describe: 'Force-closes an auction after the bidding period. Available in non-production environments.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),

      handler: asyncHandler(forceCloseAuction(params))
    })

    .command({
      command: ['claim <name>'],
      describe: 'Claim an auction, if the auction is closed and you are the winner.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),

      handler: asyncHandler(claimAuction(params))
    })

    .command({
      command: ['list'],
      describe: 'List auctions.',

      handler: asyncHandler(listAuctions(params))
    })
});
