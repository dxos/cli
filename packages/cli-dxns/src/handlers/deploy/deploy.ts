//
// Copyright 2022 DXOS.org
//

import { log } from '@dxos/debug';

import { Params } from '../../interfaces';
import { loadConfig } from '../../utils/config';
import { build } from './build';
import { publish } from './publish';
import { register } from './register';

export const deploy = (params: Params) => async (argv: any) => {
  const { verbose, config: configPath } = argv;
  const moduleConfig = await loadConfig(configPath);

  for (const module of moduleConfig.values.package?.modules ?? []) {
    verbose && log(`Deploying  module ${module.name}...`);

    await build(module)(argv);
    const cid = await publish({ config: params.config, module })(argv);
    const client = await params.getDXNSClient();
    const account = await client.getDXNSAccount(argv);
    await register({ cid, account, license: moduleConfig.values.package?.license, module, ...params })(argv);
    verbose && log(`Deployed ${module.name}.`);
  }
};
