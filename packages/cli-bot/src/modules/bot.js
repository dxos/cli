//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import path from 'path';
import yaml from 'node-yaml';
import clean from 'lodash-clean';
import { load } from 'js-yaml';
import readPkgUp from 'read-pkg-up';

import { PaymentClient, decodeBase64ToObj } from '@dxos/client';
import { BotFactoryClient } from '@dxos/botkit-client';
import { Runnable, sanitizeEnv, stopService, asyncHandler, print, getGasAndFees, isGlobalYarn, getGlobalModulesPath } from '@dxos/cli-core';
import { mapToKeyValues } from '@dxos/config';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { build, publish, register } from '../handlers/bot';
import envmap from '../../env-map.yml';

import {
  SERVICE_CONFIG_FILENAME,
  getBotFactoryServiceConfig
} from '../config';

const pkg = readPkgUp.sync({ cwd: path.join(__dirname, '../') });

const BOT_TYPE = 'wrn:bot';
const BOT_FACTORY_TYPE = 'wrn:bot-factory';

const BOT_FACTORY_DEBUG_NAMESPACES = ['bot-factory', 'bot-factory:*'];

const BOT_FACTORY_EXEC = 'node';
const BOT_FACTORY_PROCESS_NAME = 'bot-factory';
const BOT_FACTORY_PATH = path.join(__dirname, '../runnable/bot-factory.js');

const DEFAULT_LOG_FILE = '/var/log/bot-factory.log';

const botFactoryRunnable = new Runnable(BOT_FACTORY_EXEC, [BOT_FACTORY_PATH]);

/**
 * @param {object} fields
 * @param {string} namespace
 */
const getBotRecord = ({ build, names, ...rest }, namespace) => {
  const record = {
    type: BOT_TYPE,
    ...rest
  };

  if (namespace) {
    record.tag = namespace;
  }

  return record;
};

/**
 * @param {object} fields
 */
const getBotFactoryRecord = (fields) => {
  const record = {
    type: BOT_FACTORY_TYPE,
    ...fields
  };

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
          .option('env', { type: 'string' })
          .option('ipfsCID', { type: 'string' })
          .option('ipfsEndpoint', { type: 'string' })
          .option('id', { type: 'string' })
          .option('name', { type: 'string' })
          .option('bot-name', { type: 'string' })
          .option('coupon', { type: 'string' })
          .option('channel', { type: 'string' })
          .option('amount', { type: 'string' }),

        handler: asyncHandler(async argv => {
          const { botName, topic, json, env, ipfsCID, ipfsEndpoint, id, name, channel, amount, coupon } = argv;
          const { interactive } = cliState;

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);

          let payment;

          if (coupon) {
            payment = decodeBase64ToObj(coupon);
          }

          // Create payment/transfer for the spawn request, if not using coupon.
          const paymentClient = new PaymentClient(config);
          await paymentClient.connect();

          if (!payment) {
            assert(channel, 'Invalid channel.');
            assert(amount, 'Invalid amount.');

            payment = await paymentClient.createTransfer(channel, amount);
          }

          const botId = await botFactoryClient.sendSpawnRequest(botName, { env, ipfsCID, ipfsEndpoint, id, name, payment });

          print({ botId }, { json });

          if (interactive) {
            await botFactoryClient.close();
          } else {
            // Workaround for segfaults from node-wrtc.
            process.exit(0);
          }
        })
      })

      .command({
        command: ['send'],
        describe: 'Send arbitrary message to a bot.',
        builder: yargs => yargs
          .option('topic', { alias: 't', type: 'string' })
          .option('bot-id', { type: 'string' })
          .option('message', { type: 'json' }),

        handler: asyncHandler(async argv => {
          const { topic, botId, message: data = {}, json } = argv;
          const { interactive } = cliState;

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);

          const message = Buffer.from(JSON.stringify(data));
          const { message: { data: result, error } } = await botFactoryClient.sendBotCommand(botId, message);

          if (error) {
            throw new Error(error);
          }

          const output = JSON.parse(result.toString());

          print(output, { json });

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
          .option('bot-id', { type: 'string' }),

        handler: asyncHandler(async argv => {
          const { botId, topic } = argv;
          const [, command] = argv._;

          const { interactive } = cliState;

          const client = await getClient();
          const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
          await botFactoryClient.sendBotManagementRequest(botId, command);

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
          .option('bot-id', { type: 'string' })
          .option('spec', { alias: 's', type: 'json' }),

        handler: asyncHandler(async argv => {
          const { topic, botId, spec } = argv;

          assert(topic, 'Invalid topic.');
          assert(botId, 'Invalid Bot Id.');

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
          log(`Inviting bot ${botId} to join '${party}' party with invitation: ${JSON.stringify(invitationObject)}.`);
          await botFactoryClient.sendInvitationRequest(botId, party, botSpec, invitationObject);

          await botFactoryClient.close();
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
        command: ['build'],
        describe: 'Upload bot package to IPFS.',
        builder: yargs => yargs
          .option('target', { type: 'string' }),

        handler: asyncHandler(build(config))
      })

      .command({
        command: ['publish'],
        describe: 'Upload bot package to IPFS.',
        builder: yargs => yargs,

        handler: asyncHandler(async argv => {
          const { version } = await publish(config)(argv);
          log(`Run 'wire bot register' to register the new bot version: ${version}`);
        })
      })

      // Register bot.
      .command({
        command: ['register'],
        describe: 'Register bot.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'array' })
          .option('version', { type: 'string' })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' }),

        handler: asyncHandler(register(config, { getBotRecord }))
      })

      .command({
        command: ['deploy'],
        describe: 'Build, publish and register bot.',
        builder: yargs => yargs
          .version(false)
          .option('name', { type: 'array' })
          .option('version', { type: 'string' })
          .option('namespace', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' })
          .option('target', { type: 'string' }),

        handler: asyncHandler(async argv => {
          await build(config)(argv);
          await publish(config)(argv);
          await register(config, { getBotRecord })(argv);
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
              .option('proc-name', { type: 'string', default: BOT_FACTORY_PROCESS_NAME })
              .option('ipc-port', { type: 'string' }),

            handler: asyncHandler(async argv => {
              const { localDev, singleInstance, logFile = DEFAULT_LOG_FILE, detached, procName, reset, verbose, ipcPort } = argv;

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
                WIRE_BOT_LOCAL_DEV: localDev,
                WIRE_CLI_NODE_PATH: await getGlobalModulesPath(await isGlobalYarn(pkg.package.name)),
                ...(ipcPort ? { WIRE_IPC_PORT: ipcPort } : {}),
                ...(detached ? { DEBUG_HIDE_DATE: true } : {})
              };

              const options = {
                name: procName,
                env,
                detached,
                singleInstance,
                logFile
              };

              if (verbose && detached) {
                log(topic);
              }

              await botFactoryRunnable.run([], options);
            })
          })

          .command({
            command: ['register'],
            describe: 'Register a bot factory.',
            builder: yargs => yargs
              .version(false)
              .option('version', { type: 'string' })
              .option('name', { type: 'array' })
              .option('data', { type: 'json' })
              .option('gas', { type: 'string' })
              .option('fees', { type: 'string' })
              .option('topic', { type: 'string' }),

            handler: asyncHandler(async (argv) => {
              const wnsConfig = config.get('services.wns');
              const { server, userKey, bondId, chainId } = wnsConfig;
              const { verbose, 'dry-run': noop, data, txKey, name = [], version } = argv;

              assert(server, 'Invalid WNS endpoint.');
              assert(userKey, 'Invalid WNS userKey.');
              assert(bondId, 'Invalid WNS Bond ID.');
              assert(chainId, 'Invalid WNS Chain ID.');

              assert(Array.isArray(name), 'Invalid BotFactory Record Name.');
              assert(version, 'Invalid BotFactory Version.');

              let { topic } = argv;
              if (!topic) {
                // Create service.yml.
                await getBotFactoryServiceConfig();

                const serviceYml = await yaml.read(path.join(process.cwd(), SERVICE_CONFIG_FILENAME));
                topic = serviceYml.topic;
              }

              const registry = new Registry(server, chainId);
              const fee = getGasAndFees(argv, wnsConfig);

              const record = getBotFactoryRecord({ ...data, version, topic });
              log(`Registering ${record.name || ''} v${record.version}...`);
              if (verbose || noop) {
                log(JSON.stringify({ registry: server, record }, undefined, 2));
              }

              let factoryId;
              if (!noop) {
                const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
                factoryId = result.data;
                log(`Record ID: ${factoryId}`);
              }

              // eslint-disable-next-line
              for await (const wrn of name) {
                log(`Assigning name ${wrn}...`);
                if (!noop) {
                  await registry.setName(wrn, factoryId, userKey, fee);
                }
              }
            })
          })

          // Query bot factories.
          .command({
            command: ['query'],
            describe: 'Query bot factories.',
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

              let factories = [];
              if (id) {
                factories = await registry.getRecordsByIds([id]);
                factories = factories
                  .filter(b => !name || (name && b.attributes.name === name))
                  .filter(b => !namespace || (namespace && b.attributes.tag === namespace));
              } else {
                const attributes = clean({ type: BOT_FACTORY_TYPE, name, tag: namespace });
                factories = await registry.queryRecords(attributes);
              }

              if (factories && factories.length) {
                log(JSON.stringify(factories, null, 2));
              }
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
              .option('topic', { alias: 't', type: 'string' })
              .option('source', { type: 'boolean' })
              .option('hard', { type: 'boolean' }),

            handler: asyncHandler(async argv => {
              const { topic, source = false, hard = false } = argv;

              const { interactive } = cliState;

              const client = await getClient();
              const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
              await botFactoryClient.sendResetRequest(source);

              if (hard) {
                await botFactoryClient.sendStopRequest();
              }

              if (interactive) {
                await botFactoryClient.close();
              } else {
                // Workaround for segfaults from node-wrtc.
                process.exit(0);
              }
            })
          })

          .command({
            command: ['stop'],
            describe: 'Stop bot factory.',
            builder: yargs => yargs
              .option('topic', { alias: 't', type: 'string' })
              .option('code', { type: 'number' }),

            handler: asyncHandler(async argv => {
              const { topic, code = 0 } = argv;

              const { interactive } = cliState;

              const client = await getClient();
              const botFactoryClient = new BotFactoryClient(client.networkManager, topic);
              await botFactoryClient.sendStopRequest(code);

              if (interactive) {
                await botFactoryClient.close();
              } else {
                // Workaround for segfaults from node-wrtc.
                process.exit(0);
              }
            })
          })
      })
  };
};
