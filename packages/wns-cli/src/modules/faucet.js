//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';
import { request } from 'graphql-request';

import { asyncHandler, print } from '@dxos/cli-core';

const requestTokensMutation = `
  mutation requestTokens($postUrl: String!) {
    requestTokens(postUrl: $postUrl) {
      status
      error
      tokens {
        type
        quantity
      }
    }
  }
`;

export const requestFaucetTokens = async (faucetEndpoint, postUrl) => {
  return request(faucetEndpoint, requestTokensMutation, { postUrl });
};

/**
 * Faucet CLI module.
 * @returns {object}
 */
export const FaucetModule = ({ config }) => ({
  command: ['faucet'],
  describe: 'Faucet.',
  builder: yargs => yargs
    .option('faucet-endpoint', { type: 'string', describe: 'Faucet GQL endpoint.' })
    .option('post-url', { type: 'string', describe: 'Tweet URL.' })

    // Request.
    .command({
      command: ['request'],
      describe: 'Request tokens from the faucet.',
      handler: asyncHandler(async argv => {
        const faucetURL = config.get('services.faucet.server');

        const { 'post-url': postUrl, 'faucet-endpoint': faucetEndpoint = faucetURL } = argv;

        assert(faucetEndpoint, 'Invalid faucet endpoint.');
        assert(postUrl, 'Invalid Post URL');

        const result = await requestFaucetTokens(faucetEndpoint, postUrl);
        print(result, { json: true });
      })
    })
});
