#!/usr/bin/env node

const [port, ipfsGateway, registryEndpoint, chainId, configFile, namespace, loginApp] = process.argv.slice(2);

require('../dist/es/server/server').serve({ port, ipfsGateway, registryEndpoint, chainId, configFile, namespace, loginApp });
