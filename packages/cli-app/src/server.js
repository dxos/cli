//
// Copyright 2020 DXOS.org
//

import fs from 'fs';
import { join } from 'path';
import os from 'os';
import express from 'express';
import fetch from 'node-fetch';
import clean from 'lodash-clean';
import yaml from 'js-yaml';
import get from 'lodash.get';

import { Registry } from '@wirelineio/registry-client';

import { BASE_URL, DEFAULT_PORT } from './config';

const MAX_CACHE_AGE = 120 * 1000;

const ensureEndsWithSlash = url => (url.endsWith('/') ? url : `${url}/`);

const ipfsRouter = (ipfsGateway) => (cid) => async (req, res, resourcePath) => {
  const response = await fetch(`${ensureEndsWithSlash(ipfsGateway)}${cid}${resourcePath}`);
  response.body.pipe(res);
};

// TODO(burdon): Create global WRN util class/function (create/parse).
const normalizeWrn = (wrn) => {
  if (wrn.startsWith('wrn:')) {
    wrn = wrn.slice(4).replace(/^\/*/, '');
  }

  return `wrn://${wrn.replace(/:/g, '/')}`;
};

const getConfigFilePath = (file = '') => {
  return file.startsWith('~') ? join(os.homedir(), file.substring(1)) : file;
};

/**
 * @param {Object} config
 * @param {String} config.registryEndpoint endpoint
 * @param {Number} config.port
 * @param {String} config.ipfsGateway
 */
export const serve = async ({ registryEndpoint, chainId, port = DEFAULT_PORT, ipfsGateway, configFile, namespace }) => {
  const registry = new Registry(registryEndpoint, chainId);
  const cache = new Map();

  const getCid = async (wrn) => {
    const cached = cache.get(wrn);
    if (cached && Date.now() < cached.expiration) {
      console.log(`Cached answer ${wrn} -> ${cached.cid}`);
      return cached.cid;
    }

    console.log(`Resolving ${wrn}`);

    const attributes = clean({ wrn });
    const { records: apps } = await registry.resolveNames([wrn]);
    console.log(apps);
    // Should resolve to only one record.
    if (apps && apps.length === 1) {
      const cid = get(apps, '[0].attributes.package["/"]');
      console.log(`Resolved ${wrn} to cid: ${cid}`);
      cache.set(wrn, { cid, expiration: Date.now() + MAX_CACHE_AGE });
      return cid;
    }

    console.log(`Found ${apps.length} apps.`, apps.map(({ name, version }) => `${name}@${version}`).join(' '));
    console.log(JSON.stringify(attributes));
  };

  // Create IPFS GATEWAY handler.
  const ipfsRoute = ipfsRouter(ipfsGateway);

  // Router handler.
  const appVersionHandler = async (req, res) => {
    let { wrn } = req.params;
    let resourcePath = req.path || '/';

    // TODO(burdon): Util for WRN handling.
    wrn = decodeURIComponent(wrn);
    if (wrn.startsWith('wrn:')) {
      wrn = normalizeWrn(wrn);
    } else {
      // Mimic the /:org/:app pattern.  This is mainly for aesthetics.
      const components = req.path.split('/').filter(component => component);
      const [app] = components;
      wrn = `wrn://${wrn}/${app}`;
      resourcePath = `/${components.slice(1).join('/')}`;
    }

    if (resourcePath === '/' && !req.originalUrl.endsWith('/')) {
      console.log(`Redirecting ${req.originalUrl} to ${req.originalUrl}/ ...`);
      return res.redirect(`${req.originalUrl}/`);
    }

    console.log(`WRN: ${wrn}, resource: ${resourcePath}`);

    const cid = await getCid(wrn);

    if (!cid) {
      console.log(`Cannot find CID for ${wrn}`);
      return res.status(404).send('Not found');
    }
    return ipfsRoute(cid)(req, res, resourcePath);
  };

  // Config handler
  const configHandler = async (req, res) => {
    try {
      const path = getConfigFilePath(configFile);
      if (!fs.existsSync(path)) {
        console.log(`File ${path} does NOT exists.`);
        return res.json({});
      }
      res.json(yaml.load(fs.readFileSync(path)));
    } catch (err) {
      console.log(err);
      res.status(500).send('Error serving config file.');
    }
  };

  // Start configuring express app.
  const app = express();

  app.use('/config/config.json', configHandler);
  app.use(`${BASE_URL}/:wrn/`, appVersionHandler);

  return app.listen(port, () => {
    console.log(`Server started on ${port}.`);
  });
};
