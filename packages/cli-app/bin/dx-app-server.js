#!/usr/bin/env node

/* eslint-disable */

const [port, ipfsGateway, configFile, namespace, loginApp, auth, keyPhrase, dxnsEndpoint] = process.argv.slice(2);

require('../dist/src/server/server').serve({ port, ipfsGateway, configFile, namespace, loginApp, auth, keyPhrase, dxnsEndpoint });
