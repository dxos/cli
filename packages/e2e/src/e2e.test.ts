//
// Copyright 2021 DXOS.org
//

import expect from 'expect';
import { promises as fs } from 'fs';
import { join } from 'path';

import { cmd } from './cli';

const PROFILE_NAME = 'e2e-test';

/**
 * NOTE: Test order is important in this file. **Tests depend on each other.**
 * The test-framework is configured to stop after first failure.
 */

describe('CLI', () => {
  it('--help', async () => {
    await cmd('--help').run();
  });

  describe('profile', () => {
    it('init profile', async () => {
      try {
        await fs.rm(join(process.env.HOME!, '.wire/profile', `${PROFILE_NAME}.yml`));
      } catch {}

      await cmd(`profile init --name ${PROFILE_NAME} --template-url https://raw.githubusercontent.com/dxos/cli/main/packages/cli/profiles/local.yml`).debug().run();
    });

    it('select profile', async () => {
      await cmd(`profile set ${PROFILE_NAME}`).run();
    });

    it('config', async () => {
      await cmd('profile config').json();
    });
  });

  describe('data', () => {
    it('party create', async () => {
      const { party } = await cmd('party create --json').json<{ party: string }>();
      expect(typeof party).toBe('string');
    });

    it('party list', async () => {
      const parties = await cmd('party list --json').json();
      expect(Array.isArray(parties)).toBe(true);
      expect(parties.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('services', () => {
    it('dxns', async () => {
      await cmd('service install --from @dxos/cli-dxns --service dxns').run();

      try {
        await cmd('service stop dxns').run();
      } catch {}

      await cmd('service start --from @dxos/cli-dxns --service dxns --replace-args -- dxns --dev --tmp --rpc-cors all -lsync=warn -lconsole-debug --ws-external --ws-port 9945').run();
    });
  });

  describe('dxns', () => {
    it('seed', async () => {
      await cmd('dxns seed --mnemonic //Alice --verbose').run()
    })
  })
});
