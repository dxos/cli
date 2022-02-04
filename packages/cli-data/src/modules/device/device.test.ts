//
// Copyright 2020 DXOS.org
//

import waitForExpect from 'wait-for-expect';

import { sleep, waitForCondition } from '@dxos/async';
import { Client } from '@dxos/client';
import { createKeyPair /*, PublicKey */ } from '@dxos/crypto';
import { Awaited } from '@dxos/echo-db';
import { createTestBroker } from '@dxos/signal';

import { StateManager } from '../../state-manager';
import { createCommand as createPartyCommand, listCommand as listPartyCommand } from '../party/commands';
import { infoCommand, inviteCommand, joinCommand } from './commands';

const getReadlineInterface = () => {
  throw new Error('getReadlineInterface not mocked.');
};

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

jest.setTimeout(2000);

describe('cli-data: Device', () => {
  let signalBroker: Awaited<ReturnType<typeof createTestBroker>>;
  let alice: Client;
  let bob: Client;
  let aliceStateManager: StateManager;
  let bobStateManager: StateManager;

  beforeAll(async () => {
    signalBroker = await createTestBroker(4002);
  });

  beforeEach(async () => {
    [alice, bob] = await Promise.all(['Alice', 'Bob'].map(async username => {
      const client = new Client({ version: 1, runtime: {services: { signal: { server: 'ws://localhost:4002' } } }});
      await client.initialize();
      if (username === 'Alice') {
        // Bob will be joining Alice's device invitation.
        await client.halo.createProfile({ ...createKeyPair(), username });
      }
      return client;
    }));
    aliceStateManager = new StateManager({ getClient: async () => alice, getReadlineInterface });
    bobStateManager = new StateManager({ getClient: async () => bob, getReadlineInterface });
  });

  afterEach(async () => {
    await sleep(20); // Issue on `protocols` side - require some time before destroying.
    await aliceStateManager?.destroy();
    await bobStateManager?.destroy();
  });

  afterAll(async () => {
    await signalBroker.stop();
  });

  test('Alice has identity and Bob has not.', async () => {
    const aliceInfo = await infoCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    const bobInfo = await infoCommand(bobStateManager).handler(DEFAULT_ARGS) as any;
    expect(aliceInfo.displayName).toEqual('Alice');
    expect(bobInfo.displayName).toBeUndefined();
    // expect(bobInfo.identityKey).toBeUndefined();
    // expect(bobInfo.deviceKey).toBeUndefined();

    // PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.identityKey));
    // PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.deviceKey));
  });

  test('Can join a device invitation.', async () => {
    const pinHelper = new PinHelper();

    const onInvitationGenerated = async (code: string) => {
      console.log(1);
      await joinCommand({ stateManager: bobStateManager }, pinHelper.getPin.bind(pinHelper)).handler({ ...DEFAULT_ARGS, code });
      console.log(2);
    };
    await inviteCommand(aliceStateManager, pinHelper.setPin.bind(pinHelper), onInvitationGenerated).handler(DEFAULT_ARGS) as any;

    await waitForExpect(async () => {
      expect((await infoCommand(aliceStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice');
      expect((await infoCommand(bobStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice'); // Got replaced because it is now Alice's device.
    }, 3000, 1000);
  });

  test('Joining device invitation removes current state and syncs with new state.', async () => {
    await createPartyCommand(aliceStateManager).handler(DEFAULT_ARGS);
    expect(await listPartyCommand(aliceStateManager).handler(DEFAULT_ARGS)).toHaveLength(1);

    const pinHelper = new PinHelper();

    const onInvitationGenerated = async (code: string) => {
      await joinCommand({ stateManager: bobStateManager }, pinHelper.getPin.bind(pinHelper)).handler({ ...DEFAULT_ARGS, code, name: NEW_PROFILE_NAME });
    };
    await inviteCommand(aliceStateManager, pinHelper.setPin.bind(pinHelper), onInvitationGenerated).handler(DEFAULT_ARGS) as any;

    await waitForExpect(async () => {
      expect(await listPartyCommand(bobStateManager).handler(DEFAULT_ARGS)).toHaveLength(1); // The parties get synced up.
    }, 3000, 1000);
  });
});
