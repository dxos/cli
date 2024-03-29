//
// Copyright 2020 DXOS.org
//

import expect from 'expect';
import waitForExpect from 'wait-for-expect';

import { sleep, waitForCondition } from '@dxos/async';
import { Client } from '@dxos/client';
import { createKeyPair /*, PublicKey */ } from '@dxos/crypto';
import { Awaited } from '@dxos/echo-db';
import { createTestBroker } from '@dxos/signal';

import { infoCommand, inviteCommand, joinCommand } from './commands';

const DEFAULT_ARGS = { $0: '', _: [], return: true };
const NEW_PROFILE_NAME = 'test';

class PinHelper {
  _pin: string | undefined

  setPin (value: string) {
    this._pin = value;
  }

  async getPin () {
    await waitForCondition(() => !!this._pin);
    return this._pin;
  }
}

describe('cli-party: Device', () => {
  let signalBroker: Awaited<ReturnType<typeof createTestBroker>>;
  let alice: Client;
  let bob: Client;
  let aliceGetClient: (name?: string) => Promise<Client>;
  let bobGetClient: (name?: string) => Promise<Client>;

  before(async () => {
    signalBroker = await createTestBroker(4002);
  });

  beforeEach(async () => {
    [alice, bob] = await Promise.all(['Alice', 'Bob'].map(async username => {
      const client = new Client({ version: 1, runtime: { services: { signal: { server: 'ws://localhost:4002' } } } });
      await client.initialize();
      if (username === 'Alice') {
        // Bob will be joining Alice's device invitation.
        await client.halo.createProfile({ ...createKeyPair(), username });
      }
      return client;
    }));
    aliceGetClient = async () => alice;
    bobGetClient = async () => bob;
  });

  afterEach(async () => {
    await sleep(200); // Issue on `protocols` side - require some time before destroying.
    await alice?.destroy();
    await bob?.destroy();
  });

  after(async () => {
    await signalBroker.stop();
  });

  it('Alice has identity and Bob has not.', async () => {
    const aliceInfo = await infoCommand({ getClient: aliceGetClient }).handler(DEFAULT_ARGS) as any;
    const bobInfo = await infoCommand({ getClient: bobGetClient }).handler(DEFAULT_ARGS) as any;
    expect(aliceInfo.displayName).toEqual('Alice');
    expect(bobInfo.displayName).toBeUndefined();
    // expect(bobInfo.identityKey).toBeUndefined();
    // expect(bobInfo.deviceKey).toBeUndefined();

    // PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.identityKey));
    // PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.deviceKey));
  });

  it('Can join a device invitation.', async () => {
    const pinHelper = new PinHelper();

    const onInvitationGenerated = async (code: string) => {
      await joinCommand({ getClient: bobGetClient, cliState: { interactive: false }, storage: { persistent: false } }, pinHelper.getPin.bind(pinHelper)).handler({ ...DEFAULT_ARGS, code, name: `${NEW_PROFILE_NAME}-1` });
    };
    await inviteCommand({ getClient: aliceGetClient }, pinHelper.setPin.bind(pinHelper), onInvitationGenerated).handler(DEFAULT_ARGS) as any;

    await waitForExpect(async () => {
      expect((await infoCommand({ getClient: aliceGetClient }).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice');
      expect((await infoCommand({ getClient: bobGetClient }).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice'); // Got replaced because it is now Alice's device.
    }, 3000, 1000);
  });
});
