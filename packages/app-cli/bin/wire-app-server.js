#!/usr/bin/env node

const [port, ipfsGateway, registryEndpoint, chainId, configFile, namespace] = process.argv.slice(2);

require('../dist/es/server').serve({ port, ipfsGateway, registryEndpoint, chainId, configFile, namespace });
