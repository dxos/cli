//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';
import { PaymentClient } from '@dxos/client';

import { PaymentModule } from './modules/payment';

import info from '../extension.yml';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

let paymentClient;

const initPaymentCliState = async (state) => {
  const { config } = state;

  paymentClient = new PaymentClient(config);
  state.paymentClient = paymentClient;
};

module.exports = createCLI(
  {
    options: CLI_CONFIG,
    modules: [PaymentModule],
    dir: __dirname,
    main: !module.parent,
    init: initPaymentCliState,
    info
  }
);
