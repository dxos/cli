//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';

export const parseFee = (fees, gas) => {
  assert(fees, 'Invalid fees.');
  assert(gas, 'Invalid gas.');

  const amount = fees.trim().split(',')
    .map(fee => fee.trim().split(/(\d+)/))
    .map(([_, amount, denom]) => ({ denom, amount }));

  return { amount, gas };
};
