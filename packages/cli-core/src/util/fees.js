//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';

export const parseGasAndFees = (gas, fees = '') => {
  assert(gas, 'Invalid gas.');

  const amount = fees.trim().split(',')
    .map(fee => fee.trim().split(/(\d+)/))
    .filter(([_, amount, denom]) => (denom && amount))
    .map(([_, amount, denom]) => ({ denom, amount }));

  return { amount, gas };
};
