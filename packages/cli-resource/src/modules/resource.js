//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import get from 'lodash.get';
import semverInc from 'semver/functions/inc';

import { asyncHandler, getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

const RESOURCE_TYPE = 'wrn:resource';

/**
 * @param {object} config
 */
const getResourceRecord = (config) => {
  const { id, version, ...rest } = config;

  const record = {
    type: RESOURCE_TYPE,
    name: id.substring(String(`${RESOURCE_TYPE}:`).length),
    version,

    ...rest
  };

  return record;
};

/**
 * App CLI module.
 */
export const ResourceModule = ({ config }) => ({
  command: ['resource'],
  describe: 'Resource CLI.',
  builder: yargs => yargs
    // Register resource.
    .command({
      command: ['update'],
      describe: 'Update resource.',
      builder: yargs => yargs
        .version(false)
        .option('id', { type: 'string', required: true })
        .option('version', { type: 'string' })
        .option('data', { type: 'json' })
        .option('gas', { type: 'string' })
        .option('fees', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { verbose, id, data, 'dry-run': noop, txKey } = argv;
        const wnsConfig = config.get('services.wns');
        const { server, userKey, bondId, chainId } = wnsConfig;

        assert(server, 'Invalid WNS endpoint.');
        assert(userKey, 'Invalid WNS userKey.');
        assert(bondId, 'Invalid WNS Bond ID.');
        assert(chainId, 'Invalid WNS Chain ID.');

        assert(id, 'Invalid Resource ID.');

        const registry = new Registry(server, chainId);

        let { version } = argv;
        if (!version) {
          const [resource] = await registry.resolveRecords([id]);
          version = get(resource, 'version');
          assert(version, 'Invalid Resource Version.');

          version = semverInc(version, 'patch');
        }

        const record = getResourceRecord({ id, version, ...data });

        log(`Registering ${record.name} v${record.version}...`);
        if (verbose || noop) {
          log(JSON.stringify({ registry: server, record }, undefined, 2));
        }

        if (noop) {
          return;
        }

        const fee = getGasAndFees(argv, wnsConfig);
        await registry.setRecord(userKey, record, txKey, bondId, fee);
      })
    })

    // Query resources.
    .command({
      command: ['query'],
      describe: 'Query resources.',
      builder: yargs => yargs
        .option('id')
        .option('name'),

      handler: asyncHandler(async argv => {
        const { id, name } = argv;

        const { server, chainId } = config.get('services.wns');

        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const registry = new Registry(server, chainId);

        let resources = [];
        if (id) {
          resources = await registry.getRecordsByIds([id]);
          resources = resources
            .filter(b => !name || (name && b.attributes.name === name));
        } else {
          const attributes = clean({ type: RESOURCE_TYPE, name });
          resources = await registry.queryRecords(attributes);
        }

        if (resources && resources.length) {
          log(JSON.stringify(resources, null, 2));
        }
      })
    })
});
