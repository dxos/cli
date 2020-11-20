//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { PaymentModule } from './modules/payment';
import { PaymentManager } from './payment-manager';

import info from '../extension.yml';

const WIRE_CLI_BASE_COMMAND = 'wire';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

let paymentManager;

const initPaymentCliState = async (state) => {
  const { config } = state;
  paymentManager = new PaymentManager(config);

  state.paymentManager = paymentManager;
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
