//
// Copyright 2022 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';

export const overrideServices = (array1: string, array2: string, field = 'service') => {
  try {
    const result = JSON.parse(array1).map((array1item: any) => {
      const array2item = JSON.parse(array2).find((arr2item: any) => arr2item[field] === array1item[field]);
      return defaultsDeep(array2item ?? {}, array1item);
    });
    return JSON.stringify(result);
  } catch (err) {
    throw new Error('Unable to parse services.');
  }
};
