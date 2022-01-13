//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import findUp from 'find-up';
import path from 'path';

import { stopService, Runnable } from '@dxos/cli-core';

const APP_SERVER_PROCESS_NAME = 'app-server';
const rootPath = path.dirname(findUp.sync('package.json', { cwd: __dirname }) ?? '../../');
const APP_SERVER_BINARY = path.join(rootPath, 'bin/dx-app-server.js');

const DEFAULT_LOG_FILE = '/var/log/app-server.log';

const serverRunnable = new Runnable(APP_SERVER_BINARY, []);

export const start = (config: any) => async ({
  namespace, port, daemon, procName = APP_SERVER_PROCESS_NAME, logFile = DEFAULT_LOG_FILE, auth
}: any) => {
  const ipfsGateway = config.get('runtime.services.ipfs.gateway');
  const configFile = config.get('runtime.cli.app.serve.config');
  const loginApp = config.get('runtime.cli.app.serve.loginApp');
  const keyPhrase = config.get('runtime.cli.app.serve.keyPhrase');

  const dxnsEndpoint = config.get('runtime.services.dxns.server');

  assert(ipfsGateway, 'Invalid IPFS Gateway.');

  const options = {
    name: procName,
    logFile,
    detached: daemon
  };

  // TODO(burdon): Document array.
  // eslint-disable-next-line
  serverRunnable.run([port, ipfsGateway, configFile, namespace || '', loginApp, auth, keyPhrase, dxnsEndpoint], options);
};

export const stop = (/* config */) => async ({
  procName = APP_SERVER_PROCESS_NAME
}) => {
  await stopService(procName);
};

export default {
  start, stop
};
