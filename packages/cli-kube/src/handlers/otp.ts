//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { generatePrintableQRCode } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export const setupOTP = () => async ({ keyPhrase }: { keyPhrase: string }) => {
  assert(keyPhrase, 'Invalid keyphrase.');

  const qr = await generatePrintableQRCode(keyPhrase);
  log(qr);
};
