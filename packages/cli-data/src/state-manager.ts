//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import lockFile from 'lockfile';
import path from 'path';
import { promisify } from 'util';

import { Client, Party } from '@dxos/client';
import { SecretProvider } from '@dxos/credentials';
import { PublicKey } from '@dxos/crypto';
import { log } from '@dxos/debug';
import { InvitationDescriptor, Item } from '@dxos/echo-db';

const STATE_STORAGE_FILENAME = 'state.json';

const DEFAULT_ITEM_UPDATE_HANDLER = (item?: Item<any>): boolean | void => {
  log(item?.toString());
};

const lock = promisify(lockFile.lock);
const unlock = promisify(lockFile.unlock);

export interface GetClientOpts {
  initProfile?: boolean,
  name?: string
}

export interface StateManagerConstructorOpts {
  storagePath?: string,
  getReadlineInterface: Function,
  getClient: (opts?: GetClientOpts) => Promise<Client>
}

/**
 * Represents state of the CLI within a party, as well as list of active parties;
 * Provides interface for authentication / invitation flow within a party.
 */
export class StateManager {
  private _party: Party | null = null;
  private _lockPath: string | undefined
  private _getReadlineInterface: StateManagerConstructorOpts['getReadlineInterface'];
  private _getClient: StateManagerConstructorOpts['getClient'];
  private _statePath: string | undefined;
  private _lockAquired: boolean;
  private _client: Client | undefined;
  private _item: Item<any> | undefined;
  private _itemUnsubscribe: Function | undefined;

  constructor (options: StateManagerConstructorOpts) {
    const { storagePath, getReadlineInterface, getClient } = options;
    assert(getReadlineInterface);

    this._getClient = getClient;
    this._getReadlineInterface = getReadlineInterface;

    this._statePath = storagePath ? path.join(storagePath, STATE_STORAGE_FILENAME) : undefined;
    this._lockPath = this._statePath ? `${this._statePath}.lock` : undefined;
    this._lockAquired = false;
  }

  public get client () {
    return this._client;
  }

  public get item () {
    return this._item;
  }

  async getClient (): Promise<Client> {
    if (this._client) {
      return this._client;
    }
    return await this.initializeClient({});
  }

  async initializeClient (opts: GetClientOpts) {
    if (this._client) {
      throw new Error('Client already initialized.');
    }
    this._client = await this._getClient(opts);
    assert(this._client);
    return this._client;
  }

  async getParty () {
    await this._assureClient();
    return this._party;
  }

  /**
   * Join Party.
   */
  async joinParty (partyKey: string | undefined, invitationDescriptor: InvitationDescriptor | undefined, passcode?: string) {
    await this._assureClient();
    assert(this._client);
    if (partyKey) {
      if (!/^[0-9a-f]{64}$/i.test(partyKey)) {
        throw new Error(`${partyKey} is not a valid party key.`);
      }
      const party = await this._client.echo.getParty(PublicKey.from(partyKey));
      assert(party);
      await this.setParty(party);
    } else if (invitationDescriptor) {
      const secretProvider: SecretProvider = () => {
        if (passcode) {
          return Promise.resolve(Buffer.from(passcode));
        }
        return new Promise(resolve => {
          const rl = this._getReadlineInterface();
          rl.question('Passcode: ', (pin: string) => {
            resolve(Buffer.from(pin));
          });
        });
      };

      const secret = await secretProvider();

      const invitation = await this._client.echo.acceptInvitation(invitationDescriptor);
      invitation.authenticate(secret);
      const party = await invitation.wait();
      await party.open();

      await this.setParty(party);
    } else {
      throw new Error('Either party key or invitation should be provided.');
    }
  }

  /**
   * Create new Party.
   */
  async createParty () {
    await this._assureClient();
    assert(this._client);

    const party = await this._client.echo.createParty();
    await this.setParty(party);

    return party;
  }

  /**
   * Create Invitation.
   */
  async createInvitation (party: Party) {
    await this._assureClient();
    assert(this._client);

    const invitation = await party.createInvitation();

    return invitation;
  }

  async destroy () {
    if (this._lockPath && this._lockAquired) {
      await unlock(this._lockPath);
      this._lockAquired = false;
    }
    await this._client?.destroy();
  }

  async _assureClient () {
    if (!this._client) {
      this._client = await this._getClient();
      await this._restoreParty();
    }
  }

  async _putLock () {
    if (this._lockPath) {
      try {
        await lock(this._lockPath);
        this._lockAquired = true;
      } catch (err) {
        throw new Error('Client is already running under the same profile. Close previously started session or choose another profile.');
      }
    }
  }

  async _restoreParty () {
    assert(this._client);
    // Restore parties.
    let currentParty: string;
    if (this._statePath && fs.existsSync(this._statePath)) {
      await this._putLock();
      const state = await fs.readJson(this._statePath);
      currentParty = (state || {}).party;
    }

    const parties = this._client.echo.queryParties();

    parties.value.forEach(party => {
      const partyKey = party.key.toHex();
      if (currentParty === partyKey) {
        this._party = party;
      }
    });
  }

  async setParty (party: Party) {
    this._party = party;

    if (this._statePath) {
      await fs.ensureFile(this._statePath);
      await fs.writeJson(this._statePath, { party: party.key.toHex() });
    }
  }

  async setItem (item: Item<any>, updateHandler = DEFAULT_ITEM_UPDATE_HANDLER) {
    await this._assureClient();

    if (this._itemUnsubscribe) {
      this._itemUnsubscribe();
      this._itemUnsubscribe = undefined;
    }

    if (this._item) {
      // Destroy item?
      this._item = undefined;
    }

    if (item) {
      const onUpdate = async () => {
        const rl = this._getReadlineInterface();
        const needPrompt = await updateHandler(item);
        if (needPrompt) {
          rl.prompt();
        }
      };

      this._item = item;
      this._itemUnsubscribe = this._item!.subscribe(onUpdate);
    }
  }
}
