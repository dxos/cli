//
// Copyright 2020 DxOS.
//

import assert from 'assert';

import { stopService, Runnable } from '@dxos/cli-core';

const APP_SERVE_PROCESS_NAME = 'app-server';
const DEFAULT_LOG_FILE = '/var/log/app-server.log';

const bin = 'wire-app-server';
const serverRunnable = new Runnable(bin, []);

export const start = config => async ({
  namespace, port, daemon, procName = APP_SERVE_PROCESS_NAME, logFile = DEFAULT_LOG_FILE
}) => {
  const endpoint = config.get('services.wns.server');
  const chainId = config.get('services.wns.chainId');
  const ipfsGateway = config.get('services.ipfs.gateway');
  const configFile = config.get('cli.app.serve.config');

  assert(endpoint, 'Invalid WNS Endpoint.');
  assert(ipfsGateway, 'Invalid IPFS Gateway.');

  const options = {
    name: procName,
    logFile,
    detached: daemon
  };

  serverRunnable.run([port, ipfsGateway, endpoint, chainId, configFile, namespace || ''], options);
};

export const stop = (/* config */) => async ({ procName = APP_SERVE_PROCESS_NAME }) => {
  await stopService(procName);
};

export default {
  start, stop
};
