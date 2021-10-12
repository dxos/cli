//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';

import { log } from '@dxos/debug';
import { CID, DXN, RecordKind } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';

import { getBotConfig, updateBotConfig } from '../../config';

export const BOT_DXN_NAME = 'dxos:type.bot';

export const register = ({ getDXNSClient }: { getDXNSClient: Function }) => async (argv: any) => {
  const { verbose, version, 'dry-run': noop, name, domain } = argv;

  const conf = {
    ...await getBotConfig(),
    ...clean({ version })
  };

  assert(name, 'Invalid DXNS record name.');
  assert(domain, 'Invalid DXNS record domain.');

  assert(conf.name, 'Invalid Bot Name.');
  assert(conf.version, 'Invalid Bot Version.');

  const { status, stdout } = spawnSync('git', [
    'describe',
    '--tags',
    '--first-parent',
    '--abbrev=99',
    '--long',
    '--dirty',
    '--always'
  ], { shell: true });
  conf.repositoryVersion = status === 0 ? stdout.toString().trim() : undefined;

  log(`Registering ${conf.name}@${conf.version}...`);

  if (verbose || noop) {
    log(JSON.stringify({ record: conf }, undefined, 2));
  }

  if (!noop) {
    await updateBotConfig(conf);

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
