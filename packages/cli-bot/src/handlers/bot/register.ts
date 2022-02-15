//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { Argv } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';
import { Config } from '@dxos/config';
import { log } from '@dxos/debug';
import { CID, DXN, RecordKind } from '@dxos/registry-client';

import { getBotConfig } from '../../config';
import type { Params } from '../../modules/bot';

export const BOT_DXN_NAME = 'dxos:type.bot';

export interface BotRegisterOptions extends CoreOptions {
  name: string,
  domain: string,
  version?: string,
  'dry-run'?: boolean
}

export const botRegisterOptions = (yargs: Argv<CoreOptions>): Argv<BotRegisterOptions> => {
  return yargs.version(false)
    .option('version', { type: 'string' })
    .option('name', { type: 'string' })
    .option('domain', { type: 'string' })
    .option('dry-run', { type: 'boolean' })
    .demandOption('name')
    .demandOption('domain');
};

interface RegisterParams {
  getDXNSClient: Params['getDXNSClient'],
  config: Config
}

export const register = ({ getDXNSClient, config }: RegisterParams) => async (argv: BotRegisterOptions) => {
  const { verbose, version, 'dry-run': noop, name, domain } = argv;

  const conf = await getBotConfig();
  if (version) {
    conf.version = version;
  }

  assert(name, 'Invalid DXNS record name.');
  assert(domain, 'Invalid DXNS record domain.');

  assert(conf.name, 'Invalid Bot Name.');
  assert(conf.version, 'Invalid Bot Version.');

  log(`Registering ${conf.name}@${conf.version}...`);

  if (verbose || noop) {
    log(JSON.stringify({ record: conf }, undefined, 2));
  }

  if (!noop) {
    const { description, package: pkg, ...rest } = conf;

    const { registryClient, getDXNSAccount } = await getDXNSClient();
    const account = getDXNSAccount();

    const botType = await registryClient.getResourceRecord(DXN.parse(BOT_DXN_NAME), 'latest');
    assert(botType);
    assert(botType.record.kind === RecordKind.Type);

    const cid = await registryClient.insertDataRecord({
      hash: CID.from(pkg['/']).value,
      ...rest
    }, botType.record.cid, {
      description
    });

    const domainKey = await registryClient.resolveDomainName(domain);
    const dxn = DXN.fromDomainKey(domainKey, name);
    await registryClient.updateResource(dxn, account, cid);
  }

  log(`Registered ${conf.name}@${conf.version}.`);
};
