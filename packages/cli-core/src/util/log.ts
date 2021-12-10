//
// Copyright 2020 DXOS.org
//

import { getTable } from 'console.table';

import { log, logError, logs } from '@dxos/debug';

const CLI_DEBUG_NAMESPACE = 'dxos:cli';

type PrintOptions = {
  json?: boolean
}

/**
 * @param {any} data
 * @param {PrintOptions} options
 */
export const print = (data: any, options: PrintOptions = {}) => {
  if (process.env.NODE_ENV === 'test') {
    return data; // No human readable output needed. Return data for test asserts.
  }
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

  const logErrorWithDebug = (err: any) => {
    debugLog(err);
    logError(err);
  };

  return {
    log,
    debugLog,
    logError: logErrorWithDebug
  };
};
