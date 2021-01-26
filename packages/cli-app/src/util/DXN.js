//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

const PREFIX = 'dxn://';

// TODO(burdon): NOTE Current names will change
// dxn://dxos/application/console => dxn://dxos:application/console

// Example: dxn://dxos:app/console@alpha
const PATTERN = new RegExp(PREFIX + '(.+):(.+)');

// TODO(burdon): Enforce in registry.
// a-z A-Z 0-9 _ / - . @ ~
const VALID_CHARS = /^[\w/\-.@~]+$/;

function validChars (str) {
  const match = str.match(VALID_CHARS);
  assert(match, 'Invalid characters: ' + str);
  return str;
}

// TODO(burdon): Rename DXN.
// TODO(burdon): Factor out to registry-client.
export class DXN {
  // TODO(burdon): Convert to legacy format. (Reset registry?)
  static legacy (resource) {
    return `${PREFIX}${resource.authority}/${resource.path}`;
  }

  static parse (name) {
    const [, authority, path] = name.match(PATTERN);
    return new DXN(authority, path);
  }

  constructor (authority, path) {
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
