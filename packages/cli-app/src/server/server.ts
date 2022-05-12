//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import bodyParser from 'body-parser';
import { boolean } from 'boolean';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import debug from 'debug';
import express, { Request, RequestHandler, Response } from 'express';
import fs from 'fs';
import get from 'lodash.get';
import fetch from 'node-fetch';
import os from 'os';
import { join } from 'path';
import urlJoin from 'url-join';

import { loadYml } from '@dxos/cli-core';
import { DXN, CID, RegistryClient, RegistryRecord } from '@dxos/registry-client';

import { BASE_URL, DEFAULT_PORT } from '../config';
import { WALLET_LOGIN_PATH, LOGIN_PATH, OTP_QR_PATH, authHandler, authSetupHandler, authMiddleware, walletAuthHandler } from './auth';
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
const ipfsRouter = (ipfsGateway: string) => (cid: string) => async (req: Request, res: Response, resourcePath: string) => {
  const url = urlJoin(ipfsGateway, cid, resourcePath);
  log('Fetching: ' + url);
  const response = await fetch(url);
  response.body?.pipe(res);
};

/**
 * Lookup CID from registry.
 */
class Resolver {
  _cache = new Map();

  constructor (private _registryClient: RegistryClient | undefined) {}

  async lookupCIDinDXNS (id: string) {
    assert(this._registryClient, 'Missing Registry Client.');
    const cached = this._cache.get(id);
    if (cached && Date.now() < cached.expiration) {
      log(`Cached from DXNS ${id} => ${cached.cid}`);
      return cached.cid;
    }

    let record: RegistryRecord | undefined;
    if (id.includes(':')) {
      const [dxn, versionOrTag] = id.split('@', 2);
      const resourceRecord = await this._registryClient.getResourceRecord(DXN.urldecode(dxn), versionOrTag ?? 'latest');
      record = resourceRecord?.record;
    } else {
      record = await this._registryClient.getRecord(CID.from(id));
    }

    if (!record) {
      log(`Not found in DXNS: ${id}`);
      return;
    }

    const ipfsCid = CID.from(Buffer.from(get(record, 'data.bundle'), 'base64'));
    const cid = ipfsCid.toString();

    this._cache.set(id, { cid, expiration: Date.now() + MAX_CACHE_AGE });
    log(`Found in DXNS ${id} => ${cid}`);
    return cid;
  }
}

export interface ServeConfig {
  registryEndpoint: string,
  port?: number,
  ipfsGateway: string,
  chainId: string,
  configFile: string,
  loginApp: any,
  auth: any,
  keyPhrase?: string,
  dxnsEndpoint: string
}

export const serve = async ({ port = DEFAULT_PORT, ipfsGateway, configFile, loginApp, auth, keyPhrase = DEFAULT_KEYPHRASE, dxnsEndpoint }: ServeConfig) => {
  let registryClient: RegistryClient | undefined;
  try {
    registryClient = await getRegistryClient(dxnsEndpoint);
  } catch (err) {}
  const resolver = new Resolver(registryClient);

  // IPFS gateway handler.
  const ipfsProxy = ipfsRouter(ipfsGateway);

  //
  // Config file handler.
  //
  const configHandler: RequestHandler = async (req, res) => {
    try {
      const path = createPath(configFile);
      if (!fs.existsSync(path)) {
        log(`File not found: ${path}`);
        return res.json({});
      }

      res.json(loadYml(path));
    } catch (err) {
      log(err);
      res.status(500);
    }
  };

  //
  // Router handler.
  // Example: dxos:application/console@alpha:service_worker.js
  //
  const appFileHandler: RequestHandler = async (req, res) => {
    const route = req.params[0];

    let file: string | undefined;
    let cid: string | undefined;

    // TODO(egorgripasov): Interim implementation for compatibility - Cleanup.
    if (registryClient) {
      try {
        const [id, ...filePath] = route.split('/');

        cid = await resolver.lookupCIDinDXNS(id);

        if (cid && !filePath.length) {
          const newUrl = req.originalUrl.includes('?') ? req.originalUrl.replace('?', '/?') : `${req.originalUrl}/`;
          return res.redirect(newUrl);
        }

        file = `/${(filePath).join('/')}`;
      } catch (err) {}
    }

    if (!cid) {
      return res.status(404).send();
    }

    return ipfsProxy(cid)(req, res, file ?? '');
  };

  // Start configuring express app.
  const app = express();

  // Middleware.
  app.use(cors());
  app.use(cookieParser(keyPhrase, { signed: true } as any));
  app.use(bodyParser.json());

  // Serve config file.
  app.use(CONFIG_PATH, configHandler);

  // Authentication.
  app.use(LOGIN_PATH, authHandler(keyPhrase));
  app.use(OTP_QR_PATH, authMiddleware(loginApp, boolean(auth)), authSetupHandler(keyPhrase));
  app.use(WALLET_LOGIN_PATH, walletAuthHandler);

  // Proxy app files.
  app.use(new RegExp(BASE_URL + '/(.+)'), authMiddleware(loginApp, boolean(auth)), appFileHandler);

  return app.listen(port, () => {
    log(`Server started on ${port}.`);
  });
};
