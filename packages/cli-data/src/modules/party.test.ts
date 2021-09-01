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
  test('Creates a party.', async () => {
    const client = new Client();
    await client.initialize();
    await client.halo.createProfile({ ...createKeyPair(), username: 'Test' });
    const stateManager = new StateManager(() => client, getReadlineInterface, {});
    expect(await stateManager.getParty()).toBeNull();

    await createCommand(stateManager);

    expect(await stateManager.getParty()).toBeDefined();
  });
});
