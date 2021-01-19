//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import get from 'lodash.get';
import os from 'os';
import { join } from 'path';
import urlJoin from 'url-join';
import yaml from 'js-yaml';

import { Registry } from '@dxos/registry-client';

import { WRN } from './util/WRN';

import { BASE_URL, DEFAULT_PORT } from './config';

const MAX_CACHE_AGE = 120 * 1000;

const CONFIG_PATH = '/config/config.json';

const log = debug('dxos:cli-app:server');
debug.enable('dxos:*');

const createPath = (file = '') => {
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

  constructor (registry) {
    assert(registry);
    this._registry = registry;
  }

  async lookupCID (name) {
    const cached = this._cache.get(name);
    if (cached && Date.now() < cached.expiration) {
      log(`Cached ${name} => ${cached.cid}`);
      return cached.cid;
    }

    const { records } = await this._registry.resolveNames([name]);
    if (!records.length) {
      log(`Not found: ${name}`);
      return;
    }

    assert(records.length === 1);
    const cid = get(records, '[0].attributes.package["/"]');
    this._cache.set(name, { cid, expiration: Date.now() + MAX_CACHE_AGE });
    log(`Found ${name} => ${cid}`);
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
export const serve = async ({ registryEndpoint, chainId, port = DEFAULT_PORT, ipfsGateway, configFile }) => {
  const registry = new Registry(registryEndpoint, chainId);
  const resolver = new Resolver(registry);

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
    const cid = await resolver.lookupCID(name);

    if (!cid) {
      return res.status(404);
    }

    return ipfsProxy(cid)(req, res, file);
  };

  // Start configuring express app.
  const app = express();

  // Serve config file.
  app.use(CONFIG_PATH, configHandler);

  // Proxy app files.
  app.use(new RegExp(BASE_URL + '/(.+)'), appFileHandler);

  return app.listen(port, () => {
    log(`Server started on ${port}.`);
  });
};
