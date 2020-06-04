//
// Copyright 2020 DxOS
//
import fs from 'fs';
import { join } from 'path';
import os from 'os';
import express from 'express';
import fetch from 'node-fetch';
import clean from 'lodash-clean';
import yaml from 'js-yaml';

import { Registry } from '@wirelineio/registry-client';

import { APP_TYPE, BASE_URL, DEFAULT_PORT } from './config';

const ensureEndsWithSlash = url => (url.endsWith('/') ? url : `${url}/`);

const ipfsRouter = (ipfsGateway) => (cid) => async (req, res) => {
  const response = await fetch(`${ensureEndsWithSlash(ipfsGateway)}${cid}${req.path}`);
  response.body.pipe(res);
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
  const cidMap = new Map();

  const getCid = async (name, version) => {
    let cacheKey = `${name}@${version}`;

    if (version && cidMap.has(cacheKey)) {
      return cidMap.get(cacheKey);
    }

    const attributes = clean({ type: APP_TYPE, tag: namespace, name, version });
    const apps = await registry.queryRecords(attributes);
    //  Should resolve to only one record.
    if (apps && apps.length === 1) {
      const [{ attributes: { name: recordName, version: recordVersion, package: cid } }] = apps;
      cacheKey = `${recordName}@${recordVersion}`;
      console.log(`Resolved ${cacheKey} cid: ${cid}`);
      cidMap.set(cacheKey, cid);
      return cid;
    }
    console.log(`Found ${apps.length} apps.`, apps.map(({ name, version }) => `${name}@${version}`).join(' '));

    console.log(JSON.stringify(attributes));
  };

  // Create IPFS GATEWAY handler.
  const ipfsRoute = ipfsRouter(ipfsGateway);

  // Router handler.
  const appVersionHandler = async (req, res) => {
    const { org, app, version } = req.params;
    const name = `${org}/${app}`;
    const cid = await getCid(name, version);

    if (!cid) {
      console.log(`Cannot find deploy for ${name}`);
      return res.status(404);
    }
    return ipfsRoute(cid)(req, res);
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

  app.use(`${BASE_URL}/:org/:app@:version/config/config.json`, configHandler);
  app.use(`${BASE_URL}/:org/:app/config/config.json`, configHandler);

  app.use(`${BASE_URL}/:org/:app@:version?`, appVersionHandler);
  app.use(`${BASE_URL}/:org/:app`, appVersionHandler);

  return app.listen(port, () => {
    console.log(`Server started on ${port}.`);
  });
};
