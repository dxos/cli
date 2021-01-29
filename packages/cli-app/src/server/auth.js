//
// Copyright 2020 DXOS.org
//

import debug from 'debug';

const log = debug('dxos:cli-app:server:auth');
debug.enable('dxos:*');

// TODO(egorgripasov): Use proper OTP flow.
const OTP = 'one-time-pass';

const COOKIE_MAX_AGE = 15;

export const LOGIN_PATH = '/login';

// TODO(egorgripasov): Permanent secret per kube.
export const COOKIE_SECRET = 'supersecret';

export const authMiddleware = (loginApp) => async (req, res, next) => {
  if (!req.signedCookies.auth) {
    log('Not authenticated.');
    // TODO(egorgripasov): Redirect to loginApp.
    return res.redirect(`${LOGIN_PATH}?redirect=${encodeURIComponent(req.originalUrl)}`);
  } else {
    next();
  }
};

export const authHandler = async (req, res) => {
  const { redirect = '/' } = req.query;
  const { otp } = req.body;

  if (otp === OTP) {
    res.cookie('auth', true, {
      maxAge: 1000 * 60 * COOKIE_MAX_AGE,
      httpOnly: true,
      signed: true
    });
    return res.redirect(decodeURIComponent(redirect));
  }

  // TODO(egorgripasov): Remove.
  res.send(`<html><form method="post" action="${req.originalUrl}">Password: <input name="otp" type="text" /></form></html>`);
};
