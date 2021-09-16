//
// Copyright 2020 DXOS.org
//

import { keyEncoder } from '@otplib/plugin-thirty-two';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { promisify } from 'util';

const toDataURL = promisify(qrcode.toDataURL);

const USER = 'any';
// TODO(egorgripasov): Per kube.
const SERVICE = 'DXOS KUBE';

const getSecret = (phrase: string) => {
  const secret = crypto.createHash('sha1').update(phrase).digest('hex').slice(0, 20);
  return keyEncoder(secret, 'hex' as any);
};

export const verifyToken = (keyPhrase: string, token: string) => authenticator.verify({ secret: getSecret(keyPhrase), token });

export const generateQRCode = async (keyPhrase: string) => {
  const otp = authenticator.keyuri(USER, SERVICE, getSecret(keyPhrase));
  const imagePath = await toDataURL(otp);
  return imagePath;
};
