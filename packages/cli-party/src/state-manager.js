//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import lockFile from 'lockfile';
import path from 'path';
import { promisify } from 'util';

import { generatePasscode } from '@dxos/credentials';
import { keyToBuffer, verify, SIGNATURE_LENGTH } from '@dxos/crypto';
import { InvitationDescriptor } from '@dxos/echo-db';

const DEFAULT_ITEM_UPDATE_HANDLER = () => {};

const STATE_STORAGE_FILENAME = 'state.json';

const lock = promisify(lockFile.lock);
const unlock = promisify(lockFile.unlock);

/**
 * Represents state of the CLI within a party, as well as list of active parties;
 * Provides interface for authentication / ivitation flow within a party.
 */
export class StateManager {
  /**
   * @type {Map<string, {partyKey: String, useCredentials: Boolean}>}
   */
  _parties = new Map();

  // TODO(egorgripasov): Deplrecate.
  _currentParty = null;

  _party = null;

  /**
   * @constructor
   * @param {Function} getClient
   * @param {Function} getReadlineInterface
   * @param {object} options
   */
  constructor (getClient, getReadlineInterface, options) {
    assert(getClient);
    assert(getReadlineInterface);

    const { storagePath } = options;

    this._getClient = getClient;
    this._getReadlineInterface = getReadlineInterface;

    this._statePath = storagePath ? path.join(storagePath, STATE_STORAGE_FILENAME) : undefined;
    this._lockPath = this._statePath ? `${this._statePath}.lock` : undefined;
    this._lockAquired = false;
  }

  get parties () {
    return this._parties;
  }

  // TODO(egorgripasov): Deprecate.
  get currentParty () {
    return this._currentParty;
  }

  // TODO(egorgripasov): Deprecate.
  get party () {
    return this._party;
  }

  get item () {
    return this._item;
  }

  async getParty () {
    await this._assureClient();
    return this._party;
  }

  isOpenParty (partyKey) {
    assert(partyKey);
    assert(this._parties.has(partyKey));

    return !this._parties.get(partyKey).useCredentials;
  }

  async setItem (item, updateHandler = DEFAULT_ITEM_UPDATE_HANDLER) {
    await this._assureClient();

    if (this._itemUnsubscribe) {
      this._itemUnsubscribe();
      this._itemUnsubscribe = null;
    }

    if (this._item) {
      // Destroy item?
      this._item = null;
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
      this._itemUnsubscribe = this._item.subscribe(onUpdate);
    }
  }

  /**
   * Join Party.
   * @param {String} partyKey
   * @param {Object} invitation
   */
  async joinParty (partyKey, invitation) {
    await this.setItem();
    if (partyKey) {
      if (!/^[0-9a-f]{64}$/i.test(partyKey)) {
        throw new Error(`${partyKey} is not a valid party key.`);
      }
      if (!this._parties.has(partyKey)) {
        throw new Error(`Party ${partyKey} in not in a party list.`);
      }
      const party = await this._client.echo.getParty(keyToBuffer(partyKey));
      await this._setParty(party);
    } else if (invitation) {
      await this._assureClient();

      if (invitation) {
        const secretProvider = () => {
          return new Promise(resolve => {
            const rl = this._getReadlineInterface();
            rl.question('Passcode: ', pin => {
              resolve(Buffer.from(pin));
            });
          });
        };

        const party = await this._client.echo.joinParty(InvitationDescriptor.fromQueryParameters(invitation), secretProvider);
        await party.open();

        await this._setParty(party);
      }
    } else {
      throw new Error('Either party key or invitation should be provided.');
    }
  }

  /**
   * Create new Party.
   */
  async createParty () {
    await this._assureClient();
    await this.setItem();

    const party = await this._client.echo.createParty();
    await this._setParty(party);

    return party;
  }

  /**
   * Create Secret Invitation.
   * @param {String} partyKey
   */
  async createSecretInvitation (partyKey) {
    assert(this._parties.has(partyKey));
    assert(this._parties.get(partyKey).useCredentials);

    const passcode = generatePasscode();
    const secretProvider = () => Buffer.from(passcode);
    const secretValidator = (invitation, secret) => secret && secret.equals(invitation.secret);

    await this._assureClient();

    const party = await this._client.echo.getParty(keyToBuffer(partyKey));
    const invitation = await party.createInvitation({ secretValidator, secretProvider });

    return { invitation: invitation.toQueryParameters(), passcode };
  }

  /**
   * Create Signature Invitation.
   * @param {String} partyKey
   * @param {String} signatureKey
   */
  async createSignatureInvitation (partyKey, signatureKey) {
    assert(this._parties.has(partyKey));
    assert(this._parties.get(partyKey).useCredentials);

    // Provided by inviter node.
    const secretValidator = async (invitation, secret) => {
      const signature = secret.slice(0, SIGNATURE_LENGTH);
      const message = secret.slice(SIGNATURE_LENGTH);
      return verify(message, signature, keyToBuffer(signatureKey));
    };

    await this._assureClient();

    const party = await this._client.echo.getParty(keyToBuffer(partyKey));
    const invitation = await party.createInvitation({ secretValidator });

    return invitation;
  }

  async destroy () {
    if (this._lockPath && this._lockAquired) {
      await unlock(this._lockPath);
      this._lockAquired = false;
    }
  }

  async _assureClient () {
    if (!this._client) {
      this._client = await this._getClient();
      await this._restoreParties();
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

  async _restoreParties () {
    // Restore parties.
    let currentParty;
    if (this._statePath && fs.existsSync(this._statePath)) {
      await this._putLock();
      const state = await fs.readJson(this._statePath);
      currentParty = (state || {}).party;
    }

    const parties = this._client.echo.queryParties();

    parties.value.map(party => {
      const partyKey = party.key.toHex();
      if (!this._parties.has(partyKey)) {
        // TODO(egorgripasov): Deprecate useCredentials.
        this._parties.set(partyKey, { partyKey, useCredentials: true });
        if (currentParty === partyKey) {
          this._party = party;
          // TODO(egorgripasov): Deprecate.
          this._currentParty = currentParty;
        }
      }
    });
  }

  async _setParty (party) {
    this._party = party;
    this._currentParty = party.key.toHex();
    this._parties.set(this._currentParty, { partyKey: this._currentParty, useCredentials: true });

    if (this._statePath) {
      await fs.ensureFile(this._statePath);
      await fs.writeJson(this._statePath, { party: this._currentParty });
    }
  }
}
