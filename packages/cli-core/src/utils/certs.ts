//
// Copyright 2020 DXOS.org
//

import download from 'download';
import fs from 'fs-extra';
import set from 'lodash.set';
import os from 'os';
import path from 'path';
import url from 'url';

export const CERTS_PATH = path.join(os.homedir(), '.dx/certs');

export const loadCerts = () => {
  if (fs.existsSync(CERTS_PATH)) {
    // eslint-disable-next-line
    require('syswide-cas').addCAs(CERTS_PATH);
  }
};

export const importCert = async (link: string) => {
  await fs.ensureDir(CERTS_PATH);

  // Ignore self-signed cert for case of import.
  set(process.env, 'npm_config_strict_ssl', 'false');

  // eslint-disable-next-line
  const parsedUrl = url.parse(link);
  const filename = `${Date.now()}-${parsedUrl.host!.replace(/\./g, '-')}-${path.basename(parsedUrl.pathname!)}`;
  await download(link, CERTS_PATH, { filename });
};
