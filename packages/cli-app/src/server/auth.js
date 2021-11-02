//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';

import { generateQRCode, verifyToken } from '@dxos/cli-core';

import { BASE_URL } from '../config';
import { createPath } from './server';

const log = debug('dxos:cli-app:server:auth');
debug.enable('dxos:*');

const COOKIE_MAX_AGE = 60;

const whitelistFile = '~/.dx/keyhole-whitelist.yml';

export const LOGIN_PATH = '/app/auth';
export const OTP_QR_PATH = '/app/auth-setup';
export const WALLET_LOGIN_PATH = '/wallet/auth';

export const authMiddleware = (loginApp, enabled) => async (req, res, next) => {
  if (!enabled) {
    next();
  } else if (!req.signedCookies.auth && !req.originalUrl.startsWith(`${BASE_URL}/${loginApp}`)) {
    log('Not authenticated.');
    return res.redirect(`${BASE_URL}/${loginApp}#${encodeURIComponent(req.originalUrl)}`);
  } else {
    next();
  }
};

export const walletAuthHandler = async (req, res) => {
  const path = createPath(whitelistFile);

  if (!fs.existsSync(path)) {
    log(`No file ${path}, whitelist is empty.`);
    return res.sendStatus(401);
  }

  const whitelist = yaml.load(fs.readFileSync(path));
  const keys = whitelist.whitelistedPublicKeys ?? [];

  if (req.body.key && keys.includes(req.body.key)) {
    log('Found public key in the whitelist');
    return res.sendStatus(200);
  } else {
    log('Didn\'t find public key in the whitelist');
    return res.sendStatus(401);
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
  const imageSrc = await generateQRCode(keyPhrase);
  res.json({ imageSrc });
};
