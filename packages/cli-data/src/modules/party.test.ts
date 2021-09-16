//
// Copyright 2020 DXOS.org
//

import { Client } from '@dxos/client';
import { createKeyPair, PublicKey } from '@dxos/crypto';
import { Awaited } from '@dxos/echo-db';
import { createTestBroker } from '@dxos/signal';

import { StateManager } from '../state-manager';
import { createCommand } from './commands/create';
import { inviteCommand } from './commands/invite';
import { joinCommand } from './commands/join';
import { listCommand } from './commands/list';
import { membersCommand } from './commands/members';

const getReadlineInterface = () => {
  throw new Error('getReadlineInterface not mocked.');
};

const DEFAULT_ARGS = { $0: '', _: [] };

jest.setTimeout(2000);

describe('cli-data: Party', () => {
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

  test('Creates a party.', async () => {
    expect(await aliceStateManager.getParty()).toBeNull();
    expect(await listCommand(aliceStateManager).handler(DEFAULT_ARGS)).toHaveLength(0);

    const createResult = await createCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    const listResult = await listCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;

    expect(await aliceStateManager.getParty()).toBeTruthy();
    expect(listResult).toHaveLength(1);
    expect(createResult.party).toEqual(listResult[0].party);
  });

  test('Creates an invitation', async () => {
    await createCommand(aliceStateManager).handler(DEFAULT_ARGS);
    const inviteResult = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;

    expect(typeof inviteResult).toBe('object');
    expect(typeof inviteResult.partyKey).toBe('string');
    expect(typeof inviteResult.invitation).toBe('string');
    expect(typeof inviteResult.passcode).toBe('string');
    PublicKey.assertValidPublicKey(PublicKey.from(inviteResult.partyKey));
  });

  test('CLI <-> CLI invitations', async () => {
    expect(await listCommand(bobStateManager).handler(DEFAULT_ARGS)).toHaveLength(0);
    await createCommand(aliceStateManager).handler(DEFAULT_ARGS);

    const inviteResult = await inviteCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    await joinCommand(bobStateManager).handler({ ...DEFAULT_ARGS, invitation: inviteResult.invitation, passcode: inviteResult.passcode });

    expect(await listCommand(bobStateManager).handler(DEFAULT_ARGS)).toHaveLength(1);
    expect(await membersCommand(aliceStateManager).handler(DEFAULT_ARGS)).toHaveLength(2);
  });
});
