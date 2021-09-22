//
// Copyright 2020 DXOS.org
//

import { InvitationQueryParameters } from '@dxos/echo-db';

export const encodeInvitation = (invite: InvitationQueryParameters) => Buffer.from(JSON.stringify(invite)).toString('base64');
export const decodeInvitation = (code: string) => JSON.parse(Buffer.from(code, 'base64').toString('utf8'));
