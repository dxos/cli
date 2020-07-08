//
// Copyright 2020 DXOS.org
//

import { getTable } from 'console.table';

import { log, logError, logs } from '@dxos/debug';

const CLI_DEBUG_NAMESPACE = 'dxos:cli';

/**
 * @param {any} data
 * @param {{ json: boolean }} options
 */
export const print = (data, options = {}) => {
  const { json = false } = options;

  if (data !== Object(data)) {
    log(data);
  } else if (json) {
    log(JSON.stringify(data, undefined, 2));
  } else {
    if (Array.isArray(data) && !data.length) {
      return;
    }
    log(getTable(data));
  }
};

/**
 * @param {string} name
 */
export const getLoggers = (name = CLI_DEBUG_NAMESPACE) => {
  const { log: debugLog } = logs(name);

  const logErrorWithDebug = err => {
    debugLog(err);
    logError(err);
  };

  return {
    log,
    logError: logErrorWithDebug
  };
};
