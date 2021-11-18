/* eslint-disable jest/expect-expect */
//
// Copyright 2021 DXOS.org
//

import expect from 'expect';
import { promises as fs } from 'fs';
import got from 'got';
import { join } from 'path';

import { HTTPServer } from '../mocks/http-server';
import { IPFS } from '../mocks/ipfs';
import { cmd } from './cli';

const PROFILE_NAME = 'e2e-test';

const APP_SERVER_PORT = 5001;
const APP_DOMAIN = 'dxos';
const APP_NAME = 'app.test';
const KUBE_NAME = 'kube.test';

/**
 * NOTE: Test order is important in this file. **Tests depend on each other.**
 * The test-framework is configured to stop after first failure.
 */

describe('CLI', () => {
  const ipfs: IPFS = new IPFS(APP_SERVER_PORT);
  const port = Math.round(Math.random() * 10000 + 5000);
  const kubeServices = [{
    name: 'app-server',
    exec: 'ghcr.io/dxos/app-server:dev',
    status: 'online',
    ports: '',
    cpu: 0,
    memory: 288432128,
    type: 'container'
  }];
  const httpServer = new HTTPServer(port, [
    {
      path: '/kube/services',
      handler: () => kubeServices
    }
  ]);

  before(async () => {
    await ipfs.start();
    await httpServer.start();
  });

  after(async () => {
    await ipfs.stop();
    await httpServer.stop();
  });

  it('--help', async () => {
    await cmd('--help').run();
  });

  describe('profile', () => {
    it('init profile', async () => {
      try {
        await fs.rm(join(process.env.HOME!, '.dx/profile', `${PROFILE_NAME}.yml`));
      } catch {}

      await cmd(`profile init --name ${PROFILE_NAME} --template-url https://raw.githubusercontent.com/dxos/cli/main/packages/cli/profiles/e2e.yml`).run();
    });

    it('select profile', async () => {
      await cmd(`profile set ${PROFILE_NAME}`).run();
    });

    // TODO(egorgripasov): Cleanup & unify profile vs config schema. Currently fails due to the warnings.
    // it('config', async () => {
      // await cmd('profile config').json();
    // });
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
      try {
        await cmd('service stop dxns').run();
      } catch {}

      await cmd('service install --from @dxos/cli-dxns --service dxns --force --dev').run();

      await cmd('service start --from @dxos/cli-dxns --service dxns --dev --replace-args -- dxns --dev --tmp --rpc-cors all -lsync=warn -lconsole-debug --ws-external --ws-port 9945').run();
    });
  });

  describe('dxns', () => {
    it('seed', async () => {
      await cmd('dxns seed --mnemonic //Alice --verbose').run();
      await cmd('dxns dummy').run();
    });

    it('list resources', async () => {
      const resources = await cmd('dxns resource list --json').json();

      expect(resources.some((r: any) => r.dxn === 'dxos:type.app')).toBe(true);
    });

    it('get resource', async () => {
      const resource = await cmd('dxns resource get dxos:type.app --json').json();

      expect(resource.dxn).toEqual('dxos:type.app');
    });

    it('list records', async () => {
      const records = await cmd('dxns record list --json').json();

      expect(records.some((r: any) => r.messageName === '.dxos.type.App')).toBe(true);
    });

    it('get record', async () => {
      const record = await cmd('dxns record get dxos:type.app --json').json();

      expect(record.messageName).toBe('.dxos.type.App');
      expect(record.cid).toBeDefined();

      const record2 = await cmd('dxns record get ' + record.cid + ' --json').json();
      expect(record).toMatchObject(record2);
    });

    it('list types', async () => {
      const types = await cmd('dxns type list --json').json();

      expect(types.some((t: any) => t.messageName === '.dxos.type.BotFactory')).toBe(true);
    });

    it('get type', async () => {
      const t = await cmd('dxns type get dxos:type.kube --json').json();

      expect(t.cid).toBeDefined();

      const t2 = await cmd('dxns type get ' + t.cid + ' --json').json();
      expect(t).toMatchObject(t2);
    });

    describe('auctions', () => {
      it('create', async () => {
        await cmd('dxns auction create test-domain 10000000').run();
      });

      it('list', async () => {
        const auctions = await cmd('dxns auction list --json').json();

        const testAuction = auctions.find((a: any) => a.name === 'test-domain');
        expect(testAuction.closed).toBe(false);
      });

      it('force-close', async () => {
        await cmd('dxns auction force-close test-domain --mnemonic //Alice').run();
      });

      it('claim', async () => {
        await cmd('dxns auction claim test-domain').run();
      });

      it('check that domain is claimed', async () => {
        const domains = await cmd('dxns domain list --json').json();

        expect(domains.some((d: any) => d.name === 'test-domain')).toBe(true);
      });
    });
  });

  describe('app', () => {
    it('start app server', async () => {
      try {
        await cmd('app serve stop').run();
      } catch {}

      await cmd('app serve start --daemon --auth false --log-file /tmp/app-server.log').run();
    });

    it('register app', async () => {
      await cmd(`app register --dxns --domain ${APP_DOMAIN} --name ${APP_NAME}`, join(__dirname, '../mocks/app')).run();
    });

    it('query app', async () => {
      const apps = await cmd('app query --dxns --json').json();
      expect(apps.length).toBe(1);
    });

    it('serve app', async () => {
      const response = await got(`http://localhost:${APP_SERVER_PORT}/app/${APP_DOMAIN}:${APP_NAME}/`);
      expect(response.statusCode).toBe(200);
    });

    it('Registers versioned and tagged app', async () => {
      await cmd(`app register --dxns --domain ${APP_DOMAIN} --name ${APP_NAME} --version 2.0.1 --tag latest --tag beta`, join(__dirname, '../mocks/app')).run();
    });

    it('Serves the app without any version', async () => {
      expect((await got(`http://localhost:${APP_SERVER_PORT}/app/${APP_DOMAIN}:${APP_NAME}/`)).statusCode).toBe(200);
    });

    it('Serves the app by a version', async () => {
      expect((await got(`http://localhost:${APP_SERVER_PORT}/app/${APP_DOMAIN}:${APP_NAME}@2.0.1/`)).statusCode).toBe(200);
    });

    it('Serves the app by tags', async () => {
      expect((await got(`http://localhost:${APP_SERVER_PORT}/app/${APP_DOMAIN}:${APP_NAME}@latest/`)).statusCode).toBe(200);
      expect((await got(`http://localhost:${APP_SERVER_PORT}/app/${APP_DOMAIN}:${APP_NAME}@beta/`)).statusCode).toBe(200);
    });

    it('Serves directly by CID', async () => {
      const records = await cmd('dxns record list --json').json();
      const cid = records.find((r: any) => r.description === 'Mock application').cid;

      expect((await got(`http://localhost:${APP_SERVER_PORT}/app/${cid}/`)).statusCode).toBe(200);
    });

    it('stop app server', async () => {
      await cmd('app serve stop').run();
    });
  });

  describe('bot', () => {
    it('query bots', async () => {
      const bots = await cmd('bot query --json').json();
      expect(bots.length).toBe(1);
    });
  });

  describe('kube', () => {
    it('register kube', async () => {
      const recordsBefore = await cmd('dxns record list --json').json();
      await cmd(`kube register --name ${KUBE_NAME} --domain ${APP_DOMAIN} --url http://localhost:${port}`).run();
      const recordsAfter = await cmd('dxns record list --json').json();
      expect(recordsAfter.length).toBe(recordsBefore.length + 1 + kubeServices.length);
    });
  });
});
