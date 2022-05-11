//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

export const parseGasAndFees = (gas: string, fees = '') => {
  assert(gas, 'Invalid gas.');

  const amount = fees.trim().split(',')
    .map(fee => fee.trim().split(/(\d+)/))
    // eslint-disable-next-line
    .filter(([_, amount, denom]) => (denom && amount))
    // eslint-disable-next-line
    .map(([_, amount, denom]) => ({ denom, amount }));

  return { amount, gas };
};

export const getGasAndFees = (argv: any, config: any = {}) => {
  return parseGasAndFees(
    String(argv.gas || config.gas),
    String(argv.fees || config.fees)
  );
};
