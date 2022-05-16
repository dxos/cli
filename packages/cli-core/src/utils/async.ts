//
// Copyright 2020 DXOS.org
//

/**
 * Wraps the invoked args handler and sets a result attribute with the value returned from the function
 * (since yargs does not support async functions, so we wrap the call with a promise.
 *
 * @param func {Function<{argv}>}
 */
export const asyncHandler = (func: Function) => {
  return async (argv: any) => {
    try {
      argv._result = await func(argv);
      return argv._result;
    } catch (err) {
      argv._result = Promise.reject(err);
    }
  };
};
