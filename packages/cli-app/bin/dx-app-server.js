#!/usr/bin/env node

/* eslint-disable */

const [port, ipfsGateway, registryEndpoint, chainId, configFile, namespace, loginApp, auth, keyPhrase, dxnsEndpoint, dxns] = process.argv.slice(2);

require('../dist/src/server/server').serve({ port, ipfsGateway, registryEndpoint, chainId, configFile, namespace, loginApp, auth, keyPhrase, dxnsEndpoint, dxns });
