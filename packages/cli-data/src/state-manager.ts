//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import fs from 'fs-extra';
import lockFile from 'lockfile';
import path from 'path';
import { promisify } from 'util';

import { Client } from '@dxos/client';
import { defaultSecretValidator, generatePasscode, SecretProvider, SecretValidator } from '@dxos/credentials';
import { keyToBuffer, verify, SIGNATURE_LENGTH, PublicKeyLike, PublicKey } from '@dxos/crypto';
import { InvitationDescriptor, InvitationQueryParameters, Party } from '@dxos/echo-db';

const DEFAULT_ITEM_UPDATE_HANDLER = () => {};

const STATE_STORAGE_FILENAME = 'state.json';

const lock = promisify(lockFile.lock);
const unlock = promisify(lockFile.unlock);

/**
 * Represents state of the CLI within a party, as well as list of active parties;
 * Provides interface for authentication / invitation flow within a party.
 */
export class StateManager {
  private _party: Party | null = null;
  private _lockPath: string | undefined
  private _getReadlineInterface: Function;
  private _getClient: Function;
  private _statePath: string | undefined;
  private _lockAquired: boolean;
  private _client: Client | undefined;

  constructor (getClient: Function, getReadlineInterface: Function, options: {storagePath?: string}) {
    assert(getClient);
    assert(getReadlineInterface);

    const { storagePath } = options;

    this._getClient = getClient;
    this._getReadlineInterface = getReadlineInterface;

    this._statePath = storagePath ? path.join(storagePath, STATE_STORAGE_FILENAME) : undefined;
    this._lockPath = this._statePath ? `${this._statePath}.lock` : undefined;
    this._lockAquired = false;
  }

  async getClient () {
    await this._assureClient();
    assert(this._client)
    return this._client;
  }

  async getParty () {
    await this._assureClient();
    return this._party;
  }

  /**
   * Join Party.
   */
  async joinParty (partyKey: string | undefined, invitation: InvitationQueryParameters, passcode?: string) {
    await this._assureClient();
    assert(this._client);
    if (partyKey) {
      if (!/^[0-9a-f]{64}$/i.test(partyKey)) {
        throw new Error(`${partyKey} is not a valid party key.`);
      }
      const party = await this._client.echo.getParty(PublicKey.from(partyKey));
      assert(party);
      await this.setParty(party);
    } else if (invitation) {
      if (invitation) {
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

        const party = await this._client.echo.joinParty(InvitationDescriptor.fromQueryParameters(invitation), secretProvider);
        await party.open();

        await this.setParty(party);
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
    assert(this._client);

    const party = await this._client.echo.createParty();
    await this.setParty(party);

    return party;
  }

  /**
   * Create Secret Invitation.
   */
  async createSecretInvitation (partyKey: string) {
    const passcode = generatePasscode();
    const secretProvider: SecretProvider = async () => Buffer.from(passcode);

    await this._assureClient();
    assert(this._client);

    const party = await this._client.echo.getParty(PublicKey.from(partyKey));
    assert(party);
    const invitation = await party.createInvitation({ secretValidator: defaultSecretValidator, secretProvider });

    return { invitation: invitation.toQueryParameters(), passcode };
  }

  /**
   * Create Signature Invitation.
   */
  async createSignatureInvitation (partyKey: string, signatureKey: string) {
    // Provided by inviter node.
    const secretValidator: SecretValidator = async (invitation, secret) => {
      const signature = secret.slice(0, SIGNATURE_LENGTH);
      const message = secret.slice(SIGNATURE_LENGTH);
      return verify(message, signature, keyToBuffer(signatureKey));
    };

    await this._assureClient();
    assert(this._client);

    const party = await this._client.echo.getParty(PublicKey.from(partyKey));
    assert(party);
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
}
