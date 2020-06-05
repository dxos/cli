//
// Copyright 2020 Wireline, Inc.
//

import { asyncHandler, print } from '@dxos/cli-core';

import { Account } from '@wirelineio/registry-client';

export const KeysModule = () => ({
  command: ['keys'],
  describe: 'Keys.',
  builder: yargs => yargs

    // Generate.
    .command({
      command: ['generate'],
      describe: 'Generate key.',
      handler: asyncHandler(async argv => {
        const { json } = argv;

        let { mnemonic } = argv;
        if (!mnemonic) {
          mnemonic = Account.generateMnemonic();
        } else {
          mnemonic = mnemonic.join(' ');
        }

        const key = Account.generateFromMnemonic(mnemonic);
        const privateKey = key.getPrivateKey();
        const publicKey = key.getPublicKey();
        const address = key.getCosmosAddress();

        print({ mnemonic, privateKey, publicKey, address }, { json });
      })
    })
});
