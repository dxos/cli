//
// Copyright 2020 DXOS.org
//

import crypto from 'crypto';
import { authenticator } from 'otplib';
import { keyEncoder } from '@otplib/plugin-thirty-two';
import qrcode from 'qrcode';
import { promisify } from 'util';

const toDataURL = promisify(qrcode.toDataURL);

const USER = 'any';
// TODO(egorgripasov): Per kube.
const SERVICE = 'DXOS KUBE';

const getSecret = (phrase) => {
  const secret = crypto.createHash('sha1').update(phrase).digest('hex').slice(0, 20);
  return keyEncoder(secret, 'hex');
};

// export const verifyToken = (keyPhrase, token) => authenticator.verify({ secret: getSecret(keyPhrase), token });

export const verifyToken = () => true;

export const generateQRCode = async (keyPhrase) => {
  const otp = authenticator.keyuri(USER, SERVICE, getSecret(keyPhrase));
  const imagePath = await toDataURL(otp);
  return imagePath;
};
