//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { generatePasscode } from '@dxos/credentials';
import { keyToBuffer, verify, SIGNATURE_LENGTH } from '@dxos/crypto';
import { InvitationDescriptor } from '@dxos/echo-db';

const DEFAULT_ITEM_UPDATE_HANDLER = () => {};

/**
 * Represents state of the CLI within a party, as well as list of active parties;
 * Provides interface for authentication / ivitation flow within a party.
 */
export class StateManager {
  /**
   * @type {Map<string, {partyKey: String, useCredentials: Boolean}>}
   */
  _parties = new Map();

  // TODO(egorgripasov): Deplrecated.
  _currentParty = null;

  _party = null;

  /**
   * @constructor
   * @param {Function} getClient
   * @param {Function} getReadlineInterface
   */
  constructor (getClient, getReadlineInterface) {
    assert(getClient);
    assert(getReadlineInterface);

    this._getClient = getClient;
    this._getReadlineInterface = getReadlineInterface;
  }

  get parties () {
    return this._parties;
  }

  get currentParty () {
    return this._currentParty;
  }

  get party () {
    return this._party;
  }

  get item () {
    return this._item;
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
    if ((partyKey && /^[0-9a-f]{64}$/i.test(partyKey)) || invitation) {
      if (invitation || this._currentParty !== partyKey) {
        if (invitation || !this._parties.has(partyKey)) {
          await this._assureClient();
          await this.setItem();

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

            this._party = party;

            partyKey = party.key.toHex();
          }

          this._parties.set(partyKey, { partyKey, useCredentials: !!invitation });
        }

        this._currentParty = partyKey;
      }
    }
  }

  /**
   * Create new Party.
   */
  async createParty () {
    await this._assureClient();
    await this.setItem();
    const party = await this._client.echo.createParty();

    const topic = party.key.toHex();
    // TODO(egor): useCredentials is always true now, so we can factor it out.
    this._parties.set(topic, { partyKey: topic, useCredentials: true });

    this._currentParty = topic;
    this._party = party;
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

  async _assureClient () {
    if (!this._client) {
      this._client = await this._getClient();
    }
  }
}
