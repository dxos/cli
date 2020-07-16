//
// Copyright 2020 DXOS.org
//

import fs from 'fs';
import os from 'os';
import url from 'url';
import path from 'path';
import set from 'lodash.set';
import { ensureDir } from 'fs-extra';
import download from 'download';

export const CERTS_PATH = '~/.wire/certs';

const certPath = CERTS_PATH.replace('~', os.homedir());

export const loadCerts = () => {
  if (fs.existsSync(certPath)) {
    require('syswide-cas').addCAs(certPath); // eslint-disable-line global-require
  }
};

export const importCert = async (link) => {
  await ensureDir(certPath);
  // Ignore self-signed cert for case of import.
  set(process.env, 'npm_config_strict_ssl', 'false');

  // eslint-disable-next-line
  const parsedUrl = url.parse(link);
  const filename = `${Date.now()}-${parsedUrl.host.replace(/\./g, '-')}-${path.basename(parsedUrl.pathname)}`;
  await download(link, certPath, { filename });
};
