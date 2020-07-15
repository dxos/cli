//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { log } from '@dxos/debug';

import { generatePasscode } from '@dxos/credentials';
import { keyToBuffer, keyToString, verify, SIGNATURE_LENGTH } from '@dxos/crypto';
import { InvitationDescriptor } from '@dxos/party-manager';

const DEFAULT_UPDATE_HANDLER = model => { log(JSON.stringify(model.messages)); return true; };

/**
 * Represents state of the CLI within a party, as well as list of active parties;
 * Provides interface for authentication / ivitation flow within a party.
 */
export class StateManager {
  /**
   * @type {Map<string, {partyKey: String, useCredentials: Boolean}>}
   */
  _parties = new Map();

  _currentParty = null;

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

  get model () {
    return this._model;
  }

  isOpenParty (partyKey) {
    assert(partyKey);
    assert(this._parties.has(partyKey));

    return !this._parties.get(partyKey).useCredentials;
  }

  /**
   * Set currently active model.
   * @param {Object} model
   * @param {Function} updateHandler
   */
  async setModel (model, updateHandler = DEFAULT_UPDATE_HANDLER) {
    await this._assureClient();

    if (this._removeModelListener) {
      this._removeModelListener();
      this._removeModelListener = null;
    }

    if (this._model) {
      this._client.modelFactory.destroyModel(this._model);
      this._model = null;
    }

    if (model) {
      const onUpdate = async () => {
        const rl = this._getReadlineInterface();
        const needPrompt = await updateHandler(model);
        if (needPrompt) {
          rl.prompt();
        }
      };

      this._model = model;
      this._model.on('update', onUpdate);
      this._removeModelListener = () => model.removeListener('update', onUpdate);
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
          await this.setModel();

          if (invitation) {
            const secretProvider = () => {
              return new Promise(resolve => {
                const rl = this._getReadlineInterface();
                rl.question('Passcode: ', pin => {
                  resolve(Buffer.from(pin));
                });
              });
            };

            const party = await this._client.partyManager.joinParty(InvitationDescriptor.fromQueryParameters(invitation),
              secretProvider);
            partyKey = keyToString(party.publicKey);
          }

          await this._client.partyManager.openParty(keyToBuffer(partyKey));
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
    await this.setModel();
    const party = await this._client.partyManager.createParty();
    const topic = keyToString(party.publicKey);
    // TODO(egor): useCredentials is always true now, so we can factor it out.
    this._parties.set(topic, { partyKey: topic, useCredentials: true });
    this._currentParty = topic;
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
    const secretValidator = async (invitation, secret) => secret && secret.equals(invitation.secret);

    await this._assureClient();
    const invitation = await this._client.partyManager.inviteToParty(
      keyToBuffer(partyKey),
      secretValidator,
      secretProvider
    );
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

    const secretProvider = () => {
    };

    // Provided by inviter node.
    const secretValidator = async (invitation, secret) => {
      const signature = secret.slice(0, SIGNATURE_LENGTH);
      const message = secret.slice(SIGNATURE_LENGTH);
      return verify(message, signature, keyToBuffer(signatureKey));
    };

    await this._assureClient();
    return this._client.partyManager.inviteToParty(keyToBuffer(partyKey), secretValidator, secretProvider);
  }

  async _assureClient () {
    if (!this._client) {
      this._client = await this._getClient();
    }
  }
}
