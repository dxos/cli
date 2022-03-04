//
// Copyright 2021 DXOS.org
//

import debug from 'debug';
import path from 'path';

import { sleep } from '@dxos/async';
import { getActiveProfilePath, getCurrentProfilePath, getProfileName, print } from '@dxos/cli-core';
import { AccountKey } from '@dxos/registry-client';

import { Params } from '../interfaces';

const log = debug('dxos:cli-dxns');

export const info = (params: Params) => async (argv: any) => {
  const { json, profile } = argv;
  const { getDXNSAccount, dxnsAddress } = await params.getDXNSClient();
  let account: AccountKey | undefined;
  try {
    account = await getDXNSAccount(argv);
  } catch (err: any) {
    log(err);
  }

  const activeProfile = getActiveProfilePath(profile);

  print({
    dxnsAddress: dxnsAddress,
    dxnsAccount: account?.toHex(),
    haloIdentity: path.basename(getCurrentProfilePath()),
    cliProfile: activeProfile ? getProfileName(activeProfile) : undefined
  }, { json });

  await sleep(2000);
};
