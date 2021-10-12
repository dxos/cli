//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import bodyParser from 'body-parser';
import { boolean } from 'boolean';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import debug from 'debug';
import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import get from 'lodash.get';
import fetch from 'node-fetch';
import os from 'os';
import { join } from 'path';
import urlJoin from 'url-join';

import { DXN, CID } from '@dxos/registry-client';
import { Registry } from '@wirelineio/registry-client';

import { BASE_URL, DEFAULT_PORT } from '../config';
import { WRN } from '../util/WRN';
import { WALLET_LOGIN_PATH, LOGIN_PATH, /* OTP_QR_PATH, */ authHandler, /* authSetupHandler, */ authMiddleware, walletAuthHandler } from './auth';
import { getRegistryClient } from './dxns';

const MAX_CACHE_AGE = 120 * 1000;

const CONFIG_PATH = '/config/config.json';

const DEFAULT_KEYPHRASE = 'kube';

const log = debug('dxos:cli-app:server');
debug.enable('dxos:*');

export const createPath = (file = '') => {
  return file.startsWith('~') ? join(os.homedir(), file.substring(1)) : file;
};

/**
 * Fetch IPFS file and stream body.
 * @param ipfsGateway
 */
const ipfsRouter = (ipfsGateway) => (cid) => async (req, res, resourcePath) => {
  const url = urlJoin(ipfsGateway, cid, resourcePath);
  log('Fetching: ' + url);
  const response = await fetch(url);
  response.body.pipe(res);
};

/**
 * Lookup CID from registry.
 */
class Resolver {
  _cache = new Map();

  constructor (registry, registryClient) {
    this._registry = registry;
    this._registryClient = registryClient;
  }

  // TODO(egorgripasov): Deprecate.
  async lookupCID (name) {
    if (!this._registry) {
      return;
    }

    const cached = this._cache.get(name);
    if (cached && Date.now() < cached.expiration) {
      log(`Cached ${name} => ${cached.cid}`);
      return cached.cid;
    }

    const { records } = await this._registry.resolveNames([name]);

    if (!records.length || !records[0]) {
      log(`Not found: ${name}`);
      return;
    }

    assert(records.length === 1);
    const cid = get(records, '[0].attributes.package["/"]');
    this._cache.set(name, { cid, expiration: Date.now() + MAX_CACHE_AGE });
    log(`Found ${name} => ${cid}`);
    return cid;
  }

  async lookupCIDinDXNS (id) {
    const cached = this._cache.get(id);
    if (cached && Date.now() < cached.expiration) {
      log(`Cached from DXNS ${id} => ${cached.cid}`);
      return cached.cid;
    }

    const recordCid = (await this._registryClient.getResource(DXN.parse(id)))?.tags.latest;
    const record = await this._registryClient.getRecord(recordCid);

    if (!record) {
      log(`Not found in DXNS: ${id}`);
      return;
    }

    const ipfsCid = CID.from(Buffer.from(get(record, 'data.hash'), 'base64'));
    const cid = ipfsCid.toString();

    this._cache.set(id, { cid, expiration: Date.now() + MAX_CACHE_AGE });
    log(`Found in DXNS ${id} => ${cid}`);
    return cid;
  }
}

/**
 * Test:
 * yarn server
 * curl -I localhost:5999/app/wrn:dxos:application
 *
 * @param {Object} config
 * @param {String} config.registryEndpoint endpoint
 * @param {Number} config.port
 * @param {String} config.ipfsGateway
 */
export const serve = async ({ registryEndpoint, chainId, port = DEFAULT_PORT, ipfsGateway, configFile, loginApp, auth, keyPhrase = DEFAULT_KEYPHRASE, dxnsEndpoint, dxns }) => {
  const dxnsOnly = boolean(dxns);
  const registry = dxnsOnly ? null : new Registry(registryEndpoint, chainId);

  // TODO(egorgripasov): Interim implementation for compatibility - Cleanup.
  let registryClient;
  if (dxnsEndpoint) {
    try {
      registryClient = await getRegistryClient(dxnsEndpoint);
    } catch (err) {}
  }
  const resolver = new Resolver(registry, registryClient);

  // IPFS gateway handler.
  const ipfsProxy = ipfsRouter(ipfsGateway);

  //
  // Config file handler.
  //
  const configHandler = async (req, res) => {
    try {
      const path = createPath(configFile);
      if (!fs.existsSync(path)) {
        log(`File not found: ${path}`);
        return res.json({});
      }

      res.json(yaml.load(fs.readFileSync(path)));
    } catch (err) {
      log(err);
      res.status(500);
    }
  };

  //
  // Router handler.
  // Example: dxos:application/console@alpha:service_worker.js
  //
  const appFileHandler = async (req, res) => {
    const route = req.params[0];

    let file;
    let cid;

    // TODO(egorgripasov): Interim implementation for compatibility - Cleanup.
    if (registryClient) {
      try {
        const [id, ...filePath] = route.split('/');

        cid = await resolver.lookupCIDinDXNS(id);

        if (cid && !filePath.length) {
          return res.redirect(`${req.originalUrl}/`);
        }

        file = `/${(filePath).join('/')}`;
      } catch (err) {}
    }

    // TODO(egorgripasov): Deprecate.
    if (!cid) {
      let resource;
      // TODO(egorgripasov): Deprecated (backwards comptatible).
      if (/^wrn(:|%)/i.test(route)) {
        const [name, ...filePath] = route.split('/');
        if (!filePath.length) {
          return res.redirect(`${req.originalUrl}/`);
        }

        file = `/${filePath.join('/')}`;
        const [authority, ...rest] = decodeURIComponent(name).slice(4).replace(/^\/*/, '').split(':');
        resource = new WRN(authority, rest.join('/'));
      } else {
        const [authority, path, filePath] = route.split(':');
        if (!filePath) {
          return res.redirect(`${req.originalUrl.replace(/\/$/, '')}:/`);
        }

        file = filePath;
        resource = new WRN(authority, path);
      }

      // TODO(burdon): Hack to adapt current names.
      const name = WRN.legacy(resource); // String(resource);
      cid = await resolver.lookupCID(name);
    }

    if (!cid) {
      return res.status(404).send();
    }

    return ipfsProxy(cid)(req, res, file);
  };

  // Start configuring express app.
  const app = express();

  // Middleware.
  app.use(cors());
  app.use(cookieParser(keyPhrase, { signed: true }));
  app.use(bodyParser.json());

  // Serve config file.
  app.use(CONFIG_PATH, configHandler);

  // Authentication.
  app.use(LOGIN_PATH, authHandler(keyPhrase));
  // app.use(OTP_QR_PATH, authSetupHandler(keyPhrase));
  app.use(WALLET_LOGIN_PATH, walletAuthHandler);

  // Proxy app files.
  app.use(new RegExp(BASE_URL + '/(.+)'), authMiddleware(loginApp, boolean(auth)), appFileHandler);

  return app.listen(port, () => {
    log(`Server started on ${port}.`);
  });
};
