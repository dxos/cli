//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { generateQRCode, loadYml, verifyToken } from '@dxos/cli-core';

import { BASE_URL } from '../config';
import { createPath } from './server';

const log = debug('dxos:cli-app:server:auth');
debug.enable('dxos:*');

const COOKIE_MAX_AGE = 60;

const whitelistFile = path.join(os.homedir(), '.dx/keyhole-whitelist.yml');

const bypassAuthParamRegexp = /\?code=[0-9]{6}/;

const setCookie = (res) => {
  res.cookie('auth', true, {
    maxAge: 1000 * 60 * COOKIE_MAX_AGE,
    httpOnly: true,
    signed: true
  });
};

export const LOGIN_PATH = '/app/auth';
export const OTP_QR_PATH = '/app/auth-setup';
export const WALLET_LOGIN_PATH = '/wallet/auth';

export const authMiddleware = (loginApp, enabled) => async (req, res, next) => {
  if (!enabled) {
    next();
  } else if (bypassAuthParamRegexp.test(req.originalUrl)) {
    setCookie(res);
    next();
  } else if (!req.signedCookies.auth && !req.originalUrl.startsWith(`${BASE_URL}/${loginApp}`)) {
    log('Not authenticated.');
    return res.redirect(`${BASE_URL}/${loginApp}#${req.originalUrl}`);
  } else {
    next();
  }
};

export const walletAuthHandler = async (req, res) => {
  const path = createPath(whitelistFile);
  if (!fs.existsSync(path)) {
    log(`Missing whitelist file: ${path}`);
    return res.sendStatus(401);
  }

  const whitelist = loadYml(path);
  const keys = whitelist.whitelistedPublicKeys ?? [];

  if (req.body.key && keys.includes(req.body.key)) {
    log('Found public key in the whitelist.');
    return res.sendStatus(200);
  } else {
    log('Public key not in whitelist.');
    return res.sendStatus(401);
  }
};

export const authHandler = (keyPhrase) => async (req, res) => {
  const { code } = req.body;

  if (code && verifyToken(keyPhrase, code.replace(/\s/g, ''))) {
    setCookie(res);
    return res.sendStatus(200);
  }
  return res.sendStatus(401);
};

export const authSetupHandler = (keyPhrase) => async (req, res) => {
  const imageSrc = await generateQRCode(keyPhrase);
  res.json({ imageSrc });
};
