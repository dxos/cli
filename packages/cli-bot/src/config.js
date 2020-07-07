//
// Copyright 2020 Wireline, Inc.
//

import fs from 'fs-extra';
import path from 'path';
import yaml from 'node-yaml';

import { createKeyPair, keyToString } from '@dxos/crypto';

export const SERVICE_CONFIG_FILENAME = 'service.yml';

/**
 * @returns {Object}
 */
export const getBotFactoryServiceConfig = async () => {
  const serviceConfigFile = path.join(process.cwd(), SERVICE_CONFIG_FILENAME);
  await fs.ensureFile(serviceConfigFile);
  const serviceConfig = await yaml.read(serviceConfigFile) || {};

  if (!serviceConfig.topic || !serviceConfig.secretKey) {
    const { publicKey, secretKey } = createKeyPair();
    serviceConfig.topic = keyToString(publicKey);
    serviceConfig.secretKey = keyToString(secretKey);
  }

  await yaml.write(serviceConfigFile, serviceConfig);

  return serviceConfig;
};
