//
// Copyright 2020 DXOS.org
//

import debug from 'debug';

import { BASE_URL } from '../config';
import { generateQRCode, verifyToken } from '../util/OTP';

const log = debug('dxos:cli-app:server:auth');
debug.enable('dxos:*');

const COOKIE_MAX_AGE = 60;

export const LOGIN_PATH = '/app/auth';
export const OTP_QR_PATH = '/app/auth-setup';

export const authMiddleware = (loginApp) => async (req, res, next) => {
  if (!req.signedCookies.auth && !req.originalUrl.startsWith(`${BASE_URL}/${loginApp}`)) {
    log('Not authenticated.');
    return res.redirect(`${BASE_URL}/${loginApp}#${encodeURIComponent(req.originalUrl)}`);
  } else {
    next();
  }
};

export const authHandler = (keyPhrase) => async (req, res) => {
  const { code } = req.body;

  if (code && verifyToken(keyPhrase, code.replace(/\s/g, ''))) {
    res.cookie('auth', true, {
      maxAge: 1000 * 60 * COOKIE_MAX_AGE,
      httpOnly: true,
      signed: true
    });
    return res.sendStatus(200);
  }
  return res.sendStatus(401);
};

export const authSetupHandler = (keyPhrase) => async (req, res) => {
  const imageUrl = await generateQRCode(keyPhrase);
  res.send(`<html><img src="${imageUrl}" width="400" height="400" /></html>`);
};
