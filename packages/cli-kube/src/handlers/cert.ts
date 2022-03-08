//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { importCert } from '@dxos/cli-core';

export const importCertificate = () => async ({ url }: { url: string }) => {
  assert(url, 'Invalid Cert URL.');
  await importCert(url);
};
