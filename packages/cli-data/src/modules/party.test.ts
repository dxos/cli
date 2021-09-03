//
// Copyright 2020 DXOS.org
//

import { Client } from '@dxos/client';
import { createKeyPair } from '@dxos/crypto';

import { StateManager } from '../state-manager';
import { createCommand } from './commands/create';
import { createTestBroker } from '@dxos/signal';
import { listCommand } from './commands/list';

const getReadlineInterface = () => {
  throw new Error('getReadlineInterface not mocked.');
};

const DEFAULT_ARGS = {$0: '', _: []}

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

  test.only('Creates a party.', async () => {
    expect(await aliceStateManager.getParty()).toBeNull();
    expect(await listCommand(aliceStateManager).handler(DEFAULT_ARGS)).toHaveLength(0);


    const createResult = await createCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;
    const listResult = await listCommand(aliceStateManager).handler(DEFAULT_ARGS) as any;

    expect(await aliceStateManager.getParty()).toBeTruthy();
    expect(listResult).toHaveLength(1);
    expect(createResult.party).toEqual(listResult[0].party)
  });
});
