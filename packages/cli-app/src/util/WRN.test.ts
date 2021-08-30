//
// Copyright 2020 DXOS.org
//

import { WRN } from './WRN';

test('Test valid.', () => {
  const name = WRN.parse('wrn://dxos:app/console@alpha-1.1');
  expect(String(name)).toBe('wrn://dxos:app/console@alpha-1.1');
  expect(name.authority).toBe('dxos');
  expect(name.path).toBe('app/console@alpha-1.1');
});

test('Test invalid.', () => {
  const invalid = [
    undefined,
    'invalid',
    'dxos:app/console@alpha-1.1',
    'wrn://dxos',
    'wrn://dxos:',
    'wrn://:app/console',
    'wrn://dxos:app/console!!!'
  ];

  invalid.forEach(str => {
    expect(() => WRN.parse(str as any)).toThrow();
  });
});
