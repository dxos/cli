//
// Copyright 2021 DXOS.org
//

import base from 'base-x';

import { InvitationQueryParameters } from '@dxos/echo-db';

const base62 = base('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

export const encodeInvitation = (invite: InvitationQueryParameters) => {
  const buffer = Buffer.from(JSON.stringify(invite));
  return base62.encode(buffer);
};

export const decodeInvitation = (code: string) => {
  const json = base62.decode(code).toString();
  return JSON.parse(json);
};
