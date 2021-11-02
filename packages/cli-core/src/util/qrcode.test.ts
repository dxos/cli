//
// Copyright 2021 DXOS.org
//

import expect from 'expect';
import qrcode from 'qrcode-terminal';

it('generates a QR code', () => {
  qrcode.generate('https://dxos.org', { small: true }, (code: string) => {
    expect(code).not.toBeNull();
    console.log(code);
  });
});
