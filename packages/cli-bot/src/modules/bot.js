//
// Copyright 2020 Wireline, Inc.
//

import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'node-yaml';
import fetch from 'node-fetch';
import semverInc from 'semver/functions/inc';
import clean from 'lodash-clean';
import isEqual from 'lodash.isequal';
import { load } from 'js-yaml';

import { BotFactoryClient } from '@dxos/botkit-client';
import { Runnable, sanitizeEnv, stopService, asyncHandler, readFile, writeFile, print } from '@dxos/cli-core';
import { mapToKeyValues } from '@dxos/config';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import envmap from '../../env-map.yml';

import {
  BOT_CONFIG_FILENAME,
  SERVICE_CONFIG_FILENAME,
  getBotFactoryServiceConfig
} from '../config';

const BOT_TYPE = 'wrn:bot';
const BOT_FACTORY_TYPE = 'wrn:bot-factory';

const BOT_FACTORY_DEBUG_NAMESPACES = ['bot-factory', 'bot-factory:*'];

const BOT_FACTORY_CONFIG_FILENAME = 'bot-factory.yml';

const BOT_FACTORY_EXEC = 'node';
const BOT_FACTORY_PROCESS_NAME = 'bot-factory';
const BOT_FACTORY_PATH = path.join(__dirname, '../runnable/bot-factory.js');

const DEFAULT_LOG_FILE = '/var/log/bot-factory.log';

const botFactoryRunnable = new Runnable(BOT_FACTORY_EXEC, [BOT_FACTORY_PATH]);

/**
 * @param {object} config
 * @param {string} namespace
 */
const getBotRecord = (config, namespace) => {
  const { id, name, version, ...rest } = config;

  const record = {
    type: BOT_TYPE,
    name: id.substring(String(`${BOT_TYPE}:`).length),
    version,

    displayName: name,
    ...rest
  };

  if (namespace) {
    record.tag = namespace;
  }

  return record;
};

/**
 * Bot CLI module.
 */
export const BotModule = ({ getClient, config, stateManager, cliState }) => {
  assert(getClient, 'Data client is required, run \'wire extension install @dxos/cli-data\'');

  return {
    command: ['bot'],
    describe: 'Bot CLI.',
    builder: yargs => yargs
      .command({
        command: ['spawn'],
        describe: 'Spawn new bot instance.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('bot-id', { type: 'string' }),

        handler: asyncHandler(async argv => {
          const { botId, topic, json } = argv;
          const { interactive } = cliState;

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
          const botUID = await botFactoryClient.sendSpawnRequest(botId);

          print({ botUID }, { json });

          if (interactive) {
            await botFactoryClient.close();
          } else {
            // Workaround for segfaults from node-wrtc.
            process.exit(0);
          }
        })
      })

      .command({
        command: ['stop', 'start', 'restart', 'kill'],
        describe: 'Stop bot.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('bot-uid', { type: 'string' }),

        handler: asyncHandler(async argv => {
          const { 'bot-uid': botUID, topic } = argv;
          const [, command] = argv._;

          const { interactive } = cliState;

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
          await botFactoryClient.sendBotManagementRequest(botUID, command);

          if (interactive) {
            await botFactoryClient.close();
          } else {
            // Workaround for segfaults from node-wrtc.
            process.exit(0);
          }
        })
      })

      .command({
        command: ['invite'],
        describe: 'Invite bot to a party.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('bot-uid', { type: 'string' })
          .option('spec', { alias: 's', type: 'json' }),

        handler: asyncHandler(async argv => {
          const { topic, 'bot-uid': botUID, spec } = argv;

          assert(topic, 'Invalid topic.');
          assert(botUID, 'Invalid Bot UID.');

          const botSpec = spec ? JSON.parse(spec) : {};

          const party = stateManager.currentParty;
          assert(party, 'Invalid party.');

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);

          let invitation;
          if (!stateManager.isOpenParty(party)) {
            invitation = await stateManager.createSignatureInvitation(party, topic);
          }

          const invitationObject = invitation.toQueryParameters();
          log(`Inviting bot ${botUID} to join '${party}' party with invitation: ${JSON.stringify(invitationObject)}.`);
          await botFactoryClient.sendInvitationRequest(botUID, party, botSpec, invitationObject);

          await botFactoryClient.close();
        })
      })

      // Register bot.
      .command({
        command: ['register'],
        describe: 'Register bot.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'string' })
          .option('version', { type: 'string' })
          .option('id', { type: 'string' })
          .option('namespace', { type: 'string' }),

        handler: asyncHandler(async argv => {
          const { verbose, name, id, version, namespace, 'dry-run': noop, txKey } = argv;
          const { server, userKey, bondId, chainId } = config.get('services.wns');

          assert(server, 'Invalid WNS endpoint.');
          assert(userKey, 'Invalid WNS userKey.');
          assert(bondId, 'Invalid WNS Bond ID.');
          assert(chainId, 'Invalid WNS Chain ID.');

          const botConfig = await readFile(BOT_CONFIG_FILENAME);

          const conf = {
            ...botConfig,
            ...clean({ id, name, version })
          };

          assert(conf.id, 'Invalid Bot ID.');
          assert(conf.name, 'Invalid Bot Name.');
          assert(conf.version, 'Invalid Bot Version.');

          const record = getBotRecord(conf, namespace);

          const registry = new Registry(server, chainId);
          log(`Registering ${record.name} v${record.version}...`);

          if (verbose || noop) {
            log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
          }

          if (noop) {
            return;
          }

          if (!isEqual(conf, botConfig)) {
            await writeFile(conf, BOT_CONFIG_FILENAME);
          }

          await registry.setRecord(userKey, record, txKey, bondId);
        })
      })

      // Query bots.
      .command({
        command: ['query'],
        describe: 'Query bots.',
        builder: yargs => yargs
          .option('id')
          .option('name')
          .option('namespace'),

        handler: asyncHandler(async argv => {
          const { id, name, namespace } = argv;

          const { server, chainId } = config.get('services.wns');

          assert(server, 'Invalid WNS endpoint.');
          assert(chainId, 'Invalid WNS Chain ID.');

          const registry = new Registry(server, chainId);

          let bots = [];
          if (id) {
            bots = await registry.getRecordsByIds([id]);
            bots = bots
              .filter(b => !name || (name && b.attributes.name === name))
              .filter(b => !namespace || (namespace && b.attributes.tag === namespace));
          } else {
            const attributes = clean({ type: BOT_TYPE, name, tag: namespace });
            bots = await registry.queryRecords(attributes);
          }

          if (bots && bots.length) {
            log(JSON.stringify(bots, null, 2));
          }
        })
      })

      .command({
        command: ['factory'],
        describe: 'Bot Factory Commands.',
        builder: yargs => yargs
          .command({
            command: ['start'],
            describe: 'Run a bot factory.',
            builder: yargs => yargs
              .option('local-dev', { alias: 'd', type: 'boolean', default: false, description: 'Local development mode' })
              .option('reset', { type: 'boolean', default: false, description: 'Remove previously spawned bots' })
              .option('topic', { alias: 't', type: 'string' })
              .option('secret-key', { alias: 's', type: 'string' })
              .option('single-instance', { type: 'boolean', default: false })
              .option('detached', { type: 'boolean', alias: 'daemon', default: false })
              .option('log-file', { type: 'string' })
              .option('proc-name', { type: 'string', default: BOT_FACTORY_PROCESS_NAME }),

            handler: asyncHandler(async argv => {
              const { localDev, singleInstance, logFile = DEFAULT_LOG_FILE, detached, procName, reset } = argv;

              let { topic, secretKey } = argv;
              if (!topic || !secretKey) {
                const serviceConfig = await getBotFactoryServiceConfig();
                topic = serviceConfig.topic;
                secretKey = serviceConfig.secretKey;
              }

              const env = {
                ...sanitizeEnv(process.env),
                DEBUG: BOT_FACTORY_DEBUG_NAMESPACES.concat(
                  process.env.DEBUG ? process.env.DEBUG.split(',') : []
                ).join(','),
                NODE_OPTIONS: '',
                ...mapToKeyValues(load(envmap), config.values),
                WIRE_BOT_RESET: reset,
                WIRE_BOT_TOPIC: topic,
                WIRE_BOT_SECRET_KEY: secretKey,
                WIRE_BOT_LOCAL_DEV: localDev
              };

              const options = {
                name: procName,
                env,
                detached,
                singleInstance,
                logFile
              };

              await botFactoryRunnable.run([], options);
            })
          })

          .command({
            command: ['register'],
            describe: 'Register a bot factory.',
            builder: yargs => yargs,

            handler: asyncHandler(async () => {
              const { server, userKey, bondId, chainId } = config.get('services.wns');

              assert(server, 'Invalid WNS endpoint.');
              assert(userKey, 'Invalid WNS userKey.');
              assert(bondId, 'Invalid WNS Bond ID.');
              assert(chainId, 'Invalid WNS Chain ID.');

              // Create service.yml.
              await getBotFactoryServiceConfig();

              const botFactoryConfigFile = path.join(process.cwd(), BOT_FACTORY_CONFIG_FILENAME);
              if (!fs.existsSync(botFactoryConfigFile)) {
                throw new Error(`File not found: ${BOT_FACTORY_CONFIG_FILENAME}`);
              }

              const botFactoryYml = await yaml.read(botFactoryConfigFile);
              const serviceYml = await yaml.read(path.join(process.cwd(), SERVICE_CONFIG_FILENAME));
              const { topic } = serviceYml;

              const record = {
                ...botFactoryYml,
                ...serviceYml,
                type: BOT_FACTORY_TYPE,
                accessKey: topic
              };

              // Scrub certain info from WNS record.
              delete record.secretKey;
              delete record.topic;

              const registry = new Registry(server, chainId);
              console.log(`Registering ${record.name} v${record.version}...`);

              await registry.setRecord(userKey, record, null, bondId);
            })
          })

          .command({
            command: ['stop'],
            describe: 'Stop a bot factory.',
            builder: yargs => yargs
              .option('proc-name', { type: 'string', default: BOT_FACTORY_PROCESS_NAME }),

            handler: asyncHandler(async argv => {
              const { procName } = argv;
              await stopService(procName);
            })
          })

          .command({
            command: ['status'],
            describe: 'Get BotFactory status.',
            builder: yargs => yargs
              .option('topic', { alias: 't', type: 'string' }),

            handler: asyncHandler(async argv => {
              const { topic } = argv;
              const { interactive } = cliState;

              const client = await getClient();
              const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
              const status = await botFactoryClient.getStatus();

              log(JSON.stringify(status));

              if (interactive) {
                await botFactoryClient.close();
              } else {
                // Workaround for segfaults from node-wrtc.
                process.exit(0);
              }
            })
          })

          .command({
            command: ['reset'],
            describe: 'Reset bot factory.',
            builder: yargs => yargs
              .option('topic', { alias: 't', type: 'string' }),

            handler: asyncHandler(async argv => {
              const { topic } = argv;

              const { interactive } = cliState;

              const client = await getClient();
              const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
              await botFactoryClient.sendResetRequest();

              if (interactive) {
                await botFactoryClient.close();
              } else {
                // Workaround for segfaults from node-wrtc.
                process.exit(0);
              }
            })
          })
      })

      .command({
        command: ['publish'],
        describe: 'Upload bot package to IPFS.',
        builder: yargs => yargs,

        handler: asyncHandler(async () => {
          // Upload fails without trailing slash.
          let ipfsEndpoint = config.get('services.ipfs.gateway');
          assert(ipfsEndpoint, 'Invalid IPFS Gateway.');

          if (!ipfsEndpoint.endsWith('/')) {
            ipfsEndpoint = `${ipfsEndpoint}/`;
          }

          const files = fs.readdirSync(path.join(process.cwd(), 'out', 'dist'));
          const uploads = await Promise.all(files.map(async (file) => {
            // Upload to IPFS.
            const filePath = path.join(process.cwd(), 'out', 'dist', file);
            const response = await fetch(ipfsEndpoint, {
              method: 'POST',
              body: fs.createReadStream(filePath)
            });

            if (!response.ok) {
              throw new Error(`Upload to IPFS failed: ${response.statusText}`);
            }

            const cid = response.headers.get('Ipfs-Hash');
            log(`Uploaded ${file} to IPFS, CID: ${cid}`);

            return { file, cid };
          }));

          // Update CIDs in bot.yml.
          const botConfig = await readFile(BOT_CONFIG_FILENAME);
          botConfig.package = botConfig.package || {};

          uploads.forEach(upload => {
            const [platform, arch] = path.parse(upload.file).name.split('-');
            botConfig.package[platform] = botConfig.package[platform] || {};
            botConfig.package[platform][arch] = upload.cid;
          });

          botConfig.version = semverInc(botConfig.version, 'patch');
          await writeFile(botConfig, BOT_CONFIG_FILENAME);

          log('Package contents have changed.');
          log(`Run 'wire bot register' to register the new bot version: ${botConfig.version}`);
        })
      })
  };
};
