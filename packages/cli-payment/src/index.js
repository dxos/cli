//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { PaymentModule } from './modules/payment';
import { PaymentClient } from '@dxos/client';

import info from '../extension.yml';

const WIRE_CLI_BASE_COMMAND = 'wire';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
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
    options: WIRE_CONFIG,
    modules: [PaymentModule],
    dir: __dirname,
    main: !module.parent,
    init: initPaymentCliState,
    info
  }
);
