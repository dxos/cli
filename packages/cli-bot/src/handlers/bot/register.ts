//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { log } from '@dxos/debug';
import { CID, DXN, RecordKind } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';
import { MaybePromise } from '@dxos/util';

import { getBotConfig } from '../../config';

export const BOT_DXN_NAME = 'dxos:type.bot';

interface QueryParams {
  getDXNSClient: () => MaybePromise<{ registryClient: IRegistryClient }>;
}

export const register = ({ getDXNSClient }: QueryParams) => async (argv: any) => {
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

    const { registryClient }: { registryClient: IRegistryClient } = await getDXNSClient();

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
    await registryClient.updateResource(dxn, cid);
  }

  log(`Registered ${conf.name}@${conf.version}.`);
};
