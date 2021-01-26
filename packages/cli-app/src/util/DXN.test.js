//
// Copyright 2020 DXOS.org
//

import { DXN } from './DXN';

test('Test valid.', () => {
  const name = DXN.parse('dxn://dxos:app/console@alpha-1.1');
  expect(String(name)).toBe('dxn://dxos:app/console@alpha-1.1');
  expect(name.authority).toBe('dxos');
  expect(name.path).toBe('app/console@alpha-1.1');
});

test('Test invalid.', () => {
  const invalid = [
    undefined,
    'invalid',
    'dxos:app/console@alpha-1.1',
    'dxn://dxos',
    'dxn://dxos:',
    'dxn://:app/console',
    'dxn://dxos:app/console!!!'
  ];

  invalid.forEach(str => {
    expect(() => DXN.parse(str)).toThrow();
  });
});
