//
// Copyright 2020 DXOS.org
//

import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { promisify } from 'util';

const toDataURL = promisify(qrcode.toDataURL);

// TODO(egorgripasov): Per kube or per user?
const USER = 'you';
// TODO(egorgripasov): Per kube.
const SERVICE = 'DXOS KUBE';
// TODO(egorgripasov): Unique per kube, use authenticator.generateSecret().
const KUBE_SECRET = 'JALTSJB6IMZRQYZ4';

export const generateSecret = () => authenticator.generateSecret();

export const generateToken = () => authenticator.generate(KUBE_SECRET);

export const verifyToken = (token) => authenticator.verify({ secret: KUBE_SECRET, token });

export const generateQRCode = async () => {
  const otp = authenticator.keyuri(USER, SERVICE, KUBE_SECRET);
  const imagePath = await toDataURL(otp);
  return imagePath;
};
