//
// Copyright 2020 DXOS.org
//

import waitForExpect from 'wait-for-expect';

import { sleep } from '@dxos/async';
import { Client } from '@dxos/client';
import { createKeyPair, PublicKey } from '@dxos/crypto';
import { Awaited } from '@dxos/echo-db';
import { createTestBroker } from '@dxos/signal';

import { StateManager } from '../../state-manager';
import { decodeInvitation } from '../../utils';
import { createCommand as createPartyCommand, listCommand as listPartyCommand } from '../party/commands';
import { infoCommand, inviteCommand, joinCommand } from './commands';

const getReadlineInterface = () => {
  throw new Error('getReadlineInterface not mocked.');
};

const DEFAULT_ARGS = { $0: '', _: [], return: true };

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
      const client = new Client({ services: { signal: { server:'ws://localhost:4002' }}});
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
    expect(bobInfo.identityKey).toBeUndefined();
    expect(bobInfo.deviceKey).toBeUndefined();

    PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.identityKey));
    PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.deviceKey));
  });

  test('Creates a device invitation.', async () => {
    const invitation = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    expect(typeof invitation).toBe('object');
    expect(typeof invitation.passcode).toBe('string');
    expect(typeof invitation.code).toBe('string');

    const decoded = decodeInvitation(invitation.code);
    expect(typeof decoded.identityKey).toBe('string');
    expect(typeof decoded.invitation).toBe('string');
    expect(typeof decoded.hash).toBe('string');
    expect(typeof decoded.swarmKey).toBe('string');
    PublicKey.assertValidPublicKey(PublicKey.from(decoded.identityKey));
  });

  test('Can join a device invitation.', async () => {
    const invitation = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    await joinCommand({ stateManager: bobStateManager }).handler({ ...DEFAULT_ARGS, ...invitation });

    expect((await infoCommand(aliceStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice');
    expect((await infoCommand(bobStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice'); // Got replaced because it is now Alice's device.
  });

  test('Joining device invitation removes current state and syncs with new state.', async () => {
    await createPartyCommand(aliceStateManager).handler(DEFAULT_ARGS);
    expect(await listPartyCommand(aliceStateManager).handler(DEFAULT_ARGS)).toHaveLength(1);

    const invitation = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    await joinCommand({ stateManager: bobStateManager }).handler({ ...DEFAULT_ARGS, ...invitation }); // Bob joins device invitation.

    await waitForExpect(async () => {
      expect(await listPartyCommand(bobStateManager).handler(DEFAULT_ARGS)).toHaveLength(1); // The parties get synced up.
    }, 3000, 1000);
  });
});
