//
// Copyright 2020 DXOS.org
//

import { Client } from '@dxos/client';
import { createKeyPair } from '@dxos/crypto';

import { StateManager } from '../state-manager';
import { createCommand } from './commands/create';

const getReadlineInterface = () => {
  throw new Error('getReadlineInterface not mocked.');
};

describe('cli-data: Party', () => {
  let alice: Client
  let bob: Client
  let aliceStateManager: StateManager
  let bobStateManager: StateManager

  beforeEach(async () => {
    [alice, bob] = await Promise.all(['Alice', 'Bob'].map(async username => {
      const client = new Client();
      await client.initialize();
      await client.halo.createProfile({ ...createKeyPair(), username });
      return client
    }));
    aliceStateManager = new StateManager(() => alice, getReadlineInterface, {});
    bobStateManager = new StateManager(() => bob, getReadlineInterface, {});
  })

  test('Creates a party.', async () => {
    expect(await aliceStateManager.getParty()).toBeNull();

    await createCommand(aliceStateManager);

    expect(await aliceStateManager.getParty()).toBeDefined();
  });
});
