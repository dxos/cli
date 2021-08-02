//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { stopService, Runnable } from '@dxos/cli-core';

const APP_SERVER_PROCESS_NAME = 'app-server';
const APP_SERVER_BINARY = 'wire-app-server';

const DEFAULT_LOG_FILE = '/var/log/app-server.log';

const serverRunnable = new Runnable(APP_SERVER_BINARY, []);

export const start = (config) => async ({
  namespace, port, daemon, procName = APP_SERVER_PROCESS_NAME, logFile = DEFAULT_LOG_FILE
}) => {
  const endpoint = config.get('services.wns.server');
  const chainId = config.get('services.wns.chainId');
  const ipfsGateway = config.get('services.ipfs.gateway');
  const configFile = config.get('cli.app.serve.config');
  const loginApp = config.get('cli.app.serve.loginApp');
  const keyPhrase = config.get('cli.app.serve.keyPhrase');

  const dxnsEndpoint = config.get('services.dxns.server');

  assert(endpoint, 'Invalid WNS Endpoint.');
  assert(ipfsGateway, 'Invalid IPFS Gateway.');

  const options = {
    name: procName,
    logFile,
    detached: daemon
  };

  // TODO(burdon): Document array.
  serverRunnable.run([port, ipfsGateway, endpoint, chainId, configFile, namespace || '', loginApp, keyPhrase, dxnsEndpoint], options);
};

export const stop = (/* config */) => async ({
  procName = APP_SERVER_PROCESS_NAME
}) => {
  await stopService(procName);
};

export default {
  start, stop
};
