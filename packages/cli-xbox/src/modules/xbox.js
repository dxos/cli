//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import get from 'lodash.get';
import semverInc from 'semver/functions/inc';

import { asyncHandler, print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

const XBOX_TYPE = 'wrn:xbox';

/**
 * @param {object} config
 */
const getXBoxRecord = (config) => {
  const { id, version, ...rest } = config;

  const record = {
    type: XBOX_TYPE,
    name: id.substring(String(`${XBOX_TYPE}:`).length),
    version,

    ...rest
  };

  return record;
};

/**
 * XBox CLI module.
 */
export const XBoxModule = ({ config }) => ({
  command: ['xbox'],
  describe: 'XBox CLI.',
  builder: yargs => yargs
    // Register XBox.
    .command({
      command: ['register'],
      describe: 'Register XBox.',
      builder: yargs => yargs
        .version(false)
        .option('version', { type: 'string' })
        .option('id', { type: 'string' })
        .option('data', { type: 'json' }),

      handler: asyncHandler(async argv => {
        const { verbose, id, 'dry-run': noop, data, txKey } = argv;
        const { server, userKey, bondId, chainId } = config.get('services.wns');

        assert(server, 'Invalid WNS endpoint.');
        assert(userKey, 'Invalid WNS userKey.');
        assert(bondId, 'Invalid WNS Bond ID.');
        assert(chainId, 'Invalid WNS Chain ID.');

        assert(id, 'Invalid XBox ID.');

        const registry = new Registry(server, chainId);

        let { version } = argv;
        if (!version) {
          const [xbox] = await registry.resolveRecords([id]);
          version = get(xbox, 'version');
          assert(version, 'Invalid XBox Version.');

          version = semverInc(version, 'patch');
        }

        const record = getXBoxRecord({ ...data, id, version });

        log(`Registering ${record.name} v${record.version}...`);
        if (verbose || noop) {
          log(JSON.stringify({ registry: server, record }, undefined, 2));
        }

        if (noop) {
          return;
        }

        await registry.setRecord(userKey, record, txKey, bondId);
      })
    })

    // Query xboxes.
    .command({
      command: ['query'],
      describe: 'Query xboxes.',
      builder: yargs => yargs
        .option('id')
        .option('name'),

      handler: asyncHandler(async argv => {
        const { id, name } = argv;

        const { server, chainId } = config.get('services.wns');

        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const registry = new Registry(server, chainId);

        let xboxes = [];
        if (id) {
          xboxes = await registry.getRecordsByIds([id]);
          xboxes = xboxes
            .filter(b => !name || (name && b.attributes.name === name));
        } else {
          const attributes = clean({ type: XBOX_TYPE, name });
          xboxes = await registry.queryRecords(attributes);
        }

        if (xboxes && xboxes.length) {
          log(JSON.stringify(xboxes, null, 2));
        }
      })
    })

    // List xboxes.
    .command({
      command: ['list'],
      describe: 'List public xboxes.',
      builder: yargs => yargs,

      handler: asyncHandler(async argv => {
        const { json } = argv;
        const { server, chainId } = config.get('services.wns');

        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const registry = new Registry(server, chainId);
        const xboxes = await registry.queryRecords({ type: XBOX_TYPE });

        const urls = xboxes
          .map(box => ({ url: get(box, 'attributes.web.url') }))
          .filter(box => box.url);

        if (urls && urls.length) {
          print(urls, { json });
        }
      })
    })
});
