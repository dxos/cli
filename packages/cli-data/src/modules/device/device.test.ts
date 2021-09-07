//
// Copyright 2020 DXOS.org
//

import { Client } from '@dxos/client';
import { createKeyPair, PublicKey } from '@dxos/crypto';
import { Awaited } from '@dxos/echo-db';
import { createTestBroker } from '@dxos/signal';

import { StateManager } from '../../state-manager';
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
    signalBroker = await createTestBroker();
  });

  beforeEach(async () => {
    [alice, bob] = await Promise.all(['Alice', 'Bob'].map(async username => {
      const client = new Client();
      await client.initialize();
      await client.halo.createProfile({ ...createKeyPair(), username });
      return client;
    }));
    aliceStateManager = new StateManager(() => alice, getReadlineInterface, {});
    bobStateManager = new StateManager(() => bob, getReadlineInterface, {});
  });

  afterEach(async () => {
    await alice.destroy();
    await bob.destroy();
  });

  afterAll(async () => {
    await signalBroker.stop();
  });

  test('Has a brand new, unique identity at first.', async () => {
    const aliceInfo = await infoCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    const bobInfo = await infoCommand(bobStateManager).handler(DEFAULT_ARGS) as any;
    expect(aliceInfo.displayName).toEqual('Alice')
    expect(bobInfo.displayName).toEqual('Bob')

    PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.identityKey));
    PublicKey.assertValidPublicKey(PublicKey.from(aliceInfo.deviceKey));
    PublicKey.assertValidPublicKey(PublicKey.from(bobInfo.identityKey));
    PublicKey.assertValidPublicKey(PublicKey.from(bobInfo.deviceKey));

    expect(aliceInfo.identityKey).not.toEqual(bobInfo.identityKey)
    expect(aliceInfo.deviceKey).not.toEqual(bobInfo.deviceKey)
  });

  test('Creates a device invitation.', async () => {
    const invitation = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any
    expect(typeof invitation).toBe('object');
    expect(typeof invitation.identityKey).toBe('string');
    expect(typeof invitation.invitation).toBe('string');
    expect(typeof invitation.passcode).toBe('string');
    expect(typeof invitation.hash).toBe('string');
    expect(typeof invitation.swarmKey).toBe('string');
    PublicKey.assertValidPublicKey(PublicKey.from(invitation.identityKey));
  });

  test('Can join a device invitation.', async () => {
    const invitation = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any
    await joinCommand({stateManager: bobStateManager}).handler({...DEFAULT_ARGS, ...invitation})

    expect((await infoCommand(aliceStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice')
    expect((await infoCommand(bobStateManager).handler(DEFAULT_ARGS) as any).displayName).toEqual('Alice') // Got replaced because it is now Alice's device.
    await bobStateManager.destroy()
  });

  test.skip('Joining device invitation removes current state and sync with new state.', async () => {

  });
});
