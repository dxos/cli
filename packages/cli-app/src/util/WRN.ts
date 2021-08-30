//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { raise } from '@dxos/debug';

const PREFIX = 'wrn://';

// TODO(burdon): NOTE Current names will change
// wrn://dxos/application/console => wrn://dxos:application/console

// Example: wrn://dxos:app/console@alpha
const PATTERN = new RegExp(PREFIX + '(.+):(.+)');

// TODO(burdon): Enforce in registry.
// a-z A-Z 0-9 _ / - . @ ~
const VALID_CHARS = /^[\w/\-.@~]+$/;

function validChars (str: string) {
  const match = str.match(VALID_CHARS);
  assert(match, 'Invalid characters: ' + str);
  return str;
}

// TODO(burdon): Rename DXN.
// TODO(burdon): Factor out to registry-client.
export class WRN {
  readonly _path: string
  readonly _authority: string

  // TODO(burdon): Convert to legacy format. (Reset registry?)
  static legacy (resource: WRN) {
    return `${PREFIX}${resource.authority}/${resource.path}`;
  }

  static parse (name: string) {
    const [, authority, path] = name.match(PATTERN) ?? raise(new Error(`Could not parse WRN: '${name}'`));
    return new WRN(authority, path);
  }

  constructor (authority: string, path: string) {
    this._authority = validChars(authority);
    this._path = validChars(path);
  }

  get authority () {
    return this._authority;
  }

  get path () {
    return this._path;
  }

  toString () {
    return `${PREFIX}${this._authority}:${this._path}`;
  }
}
