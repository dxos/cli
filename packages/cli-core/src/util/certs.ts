//
// Copyright 2020 DXOS.org
//

import download from 'download';
import fs from 'fs-extra';
import set from 'lodash.set';
import os from 'os';
import path from 'path';
import url from 'url';

export const CERTS_PATH = '~/.wire/certs';

const certPath = CERTS_PATH.replace('~', os.homedir());

export const loadCerts = () => {
  if (fs.existsSync(certPath)) {
    // eslint-disable-next-line
    require('syswide-cas').addCAs(certPath);
  }
};

export const importCert = async (link: string) => {
  await fs.ensureDir(certPath);
  // Ignore self-signed cert for case of import.
  set(process.env, 'npm_config_strict_ssl', 'false');

  // eslint-disable-next-line
  const parsedUrl = url.parse(link);
  const filename = `${Date.now()}-${parsedUrl.host!.replace(/\./g, '-')}-${path.basename(parsedUrl.pathname!)}`;
  await download(link, certPath, { filename });
};
