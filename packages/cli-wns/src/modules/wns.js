//
// Copyright 2019 Wireline, Inc.
//

import assert from 'assert';
import path from 'path';
import kill from 'tree-kill';
import { spawn, spawnSync } from 'child_process';
import clean from 'lodash-clean';
import yaml from 'node-yaml';
import inquirer from 'inquirer';
import url from 'url';
import { ensureFileSync, removeSync } from 'fs-extra';
import fs from 'fs';
import os from 'os';
import get from 'lodash.get';

import {
  Runnable,
  stopService,
  asyncHandler,
  getActiveProfilePath
} from '@dxos/cli-core';

import { log } from '@dxos/debug';
import { Registry, Account } from '@wirelineio/registry-client';

import { requestFaucetTokens } from './faucet';

const WNS_EXEC = 'wnsd';
const WNS_PROCESS_NAME = 'wns';
const WNS_DEFAULT_LOG_FILE = '/var/log/wns.log';
const WNS_LOCAL_TCP_ENDPOINT = 'tcp://localhost:26657';

const WNS_LITE_EXEC = 'wnsd-lite';
const WNS_LITE_PROCESS_NAME = 'wns-lite';
const WNS_LITE_DEFAULT_LOG_FILE = '/var/log/wns-lite.log';
const WNS_LITE_SERVER_CONFIG_DIR = '~/.wire/wnsd-lite';

const WNS_CLI_EXEC = 'wnscli';

const FAUCET_TOKEN = 'uwire';
const FAUCET_AMOUNT = '1000000000';

const getConnectionInfo = (argv, config) => {
  const { server, userKey, bondId, txKey, chainId } = argv;

  const result = {
    ...config,
    ...clean({ server, userKey, bondId, txKey, chainId }),
    privateKey: txKey || userKey || config.userKey
  };

  return result;
};

/**
 * Prompt the user to enter a valid URL.
 * @param {string} name - input variable name
 * @param {string} message - prompt message
 */
export const promptUrl = async (name, message) => {
  return inquirer.prompt([{
    type: 'input',
    name,
    message,
    validate: (input) => {
      try {
        // eslint-disable-next-line
        const { host } = url.parse(input);
        if (!host) {
          return false;
        }
      } catch {
        return false;
      }

      return true;
    }
  }]);
};

export const WNSModule = ({ config }) => ({
  command: ['wns', 'w'],
  describe: 'WNS tools',
  builder: yargs => yargs

    .option('endpoint', { alias: 'server' })
    .option('user-key')
    .option('tx-key')
    .option('bond-id')
    .option('chain-id')
    .option('filename', { alias: 'f' })

    .option('id')
    .option('address')
    .option('name')
    .option('tag')

    .option('background', { type: 'boolean', alias: 'daemon', default: false })
    .option('user', { default: 'root' })

    // Start WNS.
    .command({
      command: ['start'],
      describe: 'Start local WNS.',
      builder: yargs => yargs
        .option('log-file', { type: 'string' })
        .option('lite', { type: 'boolean', default: false })
        .option('reset', { type: 'boolean', default: false })
        .option('node'),

      handler: asyncHandler(async argv => {
        const { background, logFile, lite, forward, reset, node } = argv;
        const forwardArgs = forward ? JSON.parse(forward).args : [];

        let runnable;
        let args;
        let options;

        if (lite) {
          const chainId = config.get('services.wns.chainId');

          assert(node, 'Invalid Bootstrap node.');
          assert(chainId, 'Invalid Chain Id.');

          args = ['start', '--node', node, ...forwardArgs];
          options = {
            name: WNS_LITE_PROCESS_NAME,
            logFile: logFile || WNS_LITE_DEFAULT_LOG_FILE
          };

          // Reset wns-lite.
          if (reset) {
            removeSync(WNS_LITE_SERVER_CONFIG_DIR.replace('~', os.homedir()));
            spawnSync(WNS_LITE_EXEC, ['init', '--chain-id', chainId, '--from-node', '--node', node]);
          }

          runnable = new Runnable(WNS_LITE_EXEC);
        } else {
          args = ['start', '--gql-server', '--gql-playground', ...forwardArgs];
          options = {
            name: WNS_PROCESS_NAME,
            logFile: logFile || WNS_DEFAULT_LOG_FILE
          };

          runnable = new Runnable(WNS_EXEC);
        }

        await runnable.run(args, { ...options, detached: background });
      })
    })

    // Stop WNS.
    .command({
      command: ['stop'],
      describe: 'Stop local WNS.',
      handler: asyncHandler(async () => {
        await stopService(WNS_PROCESS_NAME);
      })
    })

    // Reset WNS.
    .command({
      command: ['reset'],
      describe: 'Reset local WNS.',
      handler: asyncHandler(async argv => {
        const { user } = argv;

        const resetRegistry = async () => new Promise(resolve => {
          const args = ['tx', 'nameservice', 'clear', '--from', user, '--node', WNS_LOCAL_TCP_ENDPOINT, '--yes'];

          const options = {
            stdio: 'inherit'
          };

          const registrycli = spawn(WNS_CLI_EXEC, args, options);

          registrycli.on('exit', () => {
            resolve();
          });

          registrycli.on('SIGINT', () => {
            kill(registrycli.pid);
            process.exit();
          });
        });

        log('Resetting...');
        await resetRegistry();
      })
    })

    .command({
      command: ['status'],
      describe: 'Get WNS status.',
      handler: asyncHandler(async argv => {
        const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const registry = new Registry(server, chainId);
        const result = await registry.getStatus();
        log(JSON.stringify(result, undefined, 2));
      })
    })

    .command({
      command: ['query [query]'],
      describe: 'Run arbitrary query.',

      builder: yargs => yargs
        .option('query', { type: 'string' })
        .option('variables', { type: 'json' })
        .option('filename', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { variables = {}, filename } = argv;

        const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
        assert(server, 'Invalid WNS endpoint.');
        assert(chainId, 'Invalid WNS Chain ID.');

        const registry = new Registry(server, chainId);

        let { query } = argv;
        if (!query) {
          query = fs.readFileSync(filename && fs.existsSync(filename) ? filename : 0, 'utf-8');
        }

        assert(query, 'Invalid query.');

        try {
          const result = await registry.query(query, JSON.parse(variables));
          log(JSON.stringify(result, undefined, 2));
        } catch (err) {
          const error = get(err, 'errors[0].message', err);
          throw new Error(error);
        }
      })
    })

    .command({
      command: ['record'],
      describe: 'Record operations.',
      builder: yargs => yargs
        // Register record.
        .command({
          command: ['publish'],
          describe: 'Register record.',
          builder: yargs => yargs
            .option('bond-id', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { txKey, filename } = argv;
            const { server, userKey, bondId, chainId } = getConnectionInfo(argv, config.get('services.wns'));

            assert(server, 'Invalid WNS endpoint.');
            assert(userKey, 'Invalid User Key.');
            assert(bondId, 'Invalid Bond ID.');
            assert(chainId, 'Invalid WNS Chain ID.');

            let file = null;
            if (filename) {
              file = path.join(process.cwd(), filename);
            } else {
              file = 0; // stdin
            }

            const { record } = await yaml.read(file);
            const registry = new Registry(server, chainId);
            const result = await registry.setRecord(userKey, record, txKey, bondId);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Get record.
        .command({
          command: ['get'],
          describe: 'Get record.',
          handler: asyncHandler(async argv => {
            const { id } = argv;
            assert(id, 'Invalid Record ID.');

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.getRecordsByIds([id]);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        // List records.
        .command({
          command: ['list'],
          describe: 'List records.',
          builder: yargs => yargs
            .option('bond-id', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            const { bondId } = argv;

            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const result = await registry.queryRecords({ bondId });
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Resolve record.
        .command({
          command: ['resolve [ref]'],
          describe: 'Resolve record.',
          builder: yargs => yargs
            .option('ref'),

          handler: asyncHandler(async argv => {
            const { ref } = argv;

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const result = await registry.resolveRecords([ref]);
            log(JSON.stringify(result, undefined, 4));
          })
        })
    })

    .command({
      command: ['account'],
      describe: 'Account operations.',
      builder: yargs => yargs

        // Create account.
        .command({
          command: ['create'],
          describe: 'Create account.',
          builder: yargs => yargs
            .option('mnemonic', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { server, userKey, bondId } = getConnectionInfo(argv, config.get('services.wns'));

            assert(server, 'Invalid WNS endpoint.');
            assert(!userKey, 'User key already exists.');
            assert(!bondId, 'Bond already exists.');

            const faucetServer = config.get('services.faucet.server');

            assert(faucetServer, 'Invalid faucet endpoint.');

            let { mnemonic } = argv;
            if (!mnemonic) {
              mnemonic = Account.generateMnemonic();
            } else {
              mnemonic = mnemonic.join(' ');
            }

            const account = Account.generateFromMnemonic(mnemonic);
            const address = account.getCosmosAddress();

            const registry = new Registry(server);
            const accountResult = await registry.getAccounts([address]);
            if (accountResult.length) {
              log('Account already exists.');
              return;
            }

            const { tweetUrl } = await promptUrl('tweetUrl', `Post a Tweet with text 'Fund ${address}' and paste the Tweet URL:`);

            log('Requesting funds from faucet...');
            const { requestTokens: { status, error, tokens } } = await requestFaucetTokens(faucetServer, tweetUrl);
            if (!status) {
              log(error);
              return;
            }

            log('Got funds from faucet:');
            log(JSON.stringify(tokens, undefined, 2));

            const privateKey = account.getPrivateKey();

            log('Creating a bond...');
            await registry.createBond([{ denom: FAUCET_TOKEN, amount: FAUCET_AMOUNT }], privateKey);
            const bondsResult = await registry.queryBonds({ owner: address });

            const newBondId = bondsResult && bondsResult.length && bondsResult[0].id;
            if (!newBondId) {
              log('Error creating bond.');
              return;
            }

            log('Bond created successfully.');

            const publicKey = account.getPublicKey();
            const secrets = { mnemonic, privateKey, publicKey, address };

            // Print out all info.
            log('Account created successfully. Copy the mnemonic to another safe location.');
            log('There is no way to recover the account and associated funds if this mnemonic is lost.');
            log(JSON.stringify({ ...secrets, bondId: newBondId }, undefined, 2));

            // Write to config file.
            const profilePath = getActiveProfilePath(argv.profile);
            if (!fs.existsSync(profilePath)) {
              throw new Error(`File not found: ${profilePath}`);
            }

            // Update config file.
            const configToUpdate = yaml.readSync(profilePath);
            configToUpdate.services.wns.userKey = privateKey;
            configToUpdate.services.wns.bondId = newBondId;
            yaml.writeSync(profilePath, configToUpdate);

            // Save secrets file.
            const secretsFilePath = profilePath.replace('.yml', '.secrets.yml');
            ensureFileSync(secretsFilePath);
            yaml.writeSync(secretsFilePath, secrets);
            log(`Mnemonic saved to ${secretsFilePath}`);
          })
        })

        // Get account.
        .command({
          command: ['get'],
          describe: 'Get account.',
          handler: asyncHandler(async argv => {
            const { address } = argv;

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.getAccounts([address]);

            log(JSON.stringify(result, undefined, 2));
          })
        })
    })

    .command({
      command: ['tokens'],
      describe: 'Tokens operations.',
      builder: yargs => yargs
        // Send tokens.
        .command({
          command: ['send'],
          describe: 'Send tokens.',
          builder: yargs => yargs
            .option('type', { type: 'string' })
            .option('quantity', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { address: toAddress, type: denom, quantity: amount } = argv;

            assert(toAddress, 'Invalid Address.');
            assert(denom, 'Invalid Type.');
            assert(amount, 'Invalid Quantity.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const account = new Account(Buffer.from(privateKey, 'hex'));
            const fromAddress = account.formattedCosmosAddress;

            const registry = new Registry(server, chainId);
            await registry.sendCoins([{ denom, amount }], toAddress, privateKey);
            const result = await registry.getAccounts([fromAddress, toAddress]);
            log(JSON.stringify(result, undefined, 2));
          })
        })
    })

    .command({
      command: ['bond'],
      describe: 'Bonds operations.',
      builder: yargs => yargs
        // Get bond.
        .command({
          command: ['get'],
          describe: 'Get bond.',
          handler: asyncHandler(async argv => {
            const { id } = argv;
            console.assert(id, 'Bond Id is required.');

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const result = await registry.getBondsByIds([id]);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // List bonds.
        .command({
          command: ['list'],
          describe: 'List bonds.',
          builder: yargs => yargs
            .option('owner', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const { owner } = argv;
            const result = await registry.queryBonds({ owner });
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Create bond.
        .command({
          command: ['create'],
          describe: 'Create bond.',
          builder: yargs => yargs
            .option('type', { type: 'string' })
            .option('quantity', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { type: denom, quantity: amount } = argv;

            assert(denom, 'Invalid Type.');
            assert(amount, 'Invalid Quantity.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.createBond([{ denom, amount }], privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Refill bond.
        .command({
          command: ['refill'],
          describe: 'Refill bond.',
          builder: yargs => yargs
            .option('type', { type: 'string' })
            .option('quantity', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { id, type: denom, quantity: amount } = argv;
            assert(id, 'Invalid Bond ID.');
            assert(denom, 'Invalid Type.');
            assert(amount, 'Invalid Quantity.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.refillBond(id, [{ denom, amount }], privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Withdraw bond.
        .command({
          command: ['withdraw'],
          describe: 'Withdraw funds from bond.',
          builder: yargs => yargs
            .option('type', { type: 'string' })
            .option('quantity', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { id, type: denom, quantity: amount } = argv;
            assert(id, 'Invalid Bond ID.');
            assert(denom, 'Invalid Type.');
            assert(amount, 'Invalid Quantity.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.withdrawBond(id, [{ denom, amount }], privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Cancel bond.
        .command({
          command: ['cancel'],
          describe: 'Cancel from bond.',
          handler: asyncHandler(async argv => {
            const { id } = argv;
            assert(id, 'Invalid Bond ID.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.cancelBond(id, privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Associate bond.
        .command({
          command: ['associate'],
          describe: 'Associate record with bond.',
          builder: yargs => yargs
            .option('bond-id', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { id, bondId } = argv;
            assert(id, 'Invalid Record ID.');
            assert(bondId, 'Invalid Bond ID.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.associateBond(id, bondId, privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        // Dissociate bond.
        .command({
          command: ['dissociate'],
          describe: 'Dissociate record from bond.',
          handler: asyncHandler(async argv => {
            const { id } = argv;
            assert(id, 'Invalid Record ID.');

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.dissociateBond(id, privateKey);
            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['records'],
          describe: 'Bond records operations.',
          builder: yargs => yargs
            // Dissociate records from bond.
            .command({
              command: ['dissociate'],
              describe: 'Dissociate all records from bond.',
              builder: yargs => yargs
                .option('bond-id', { type: 'string' }),

              handler: asyncHandler(async argv => {
                const { bondId } = argv;
                assert(bondId, 'Invalid Bond ID.');

                const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const result = await registry.dissociateRecords(bondId, privateKey);
                log(JSON.stringify(result, undefined, 2));
              })
            })

            // Reassociate records (switch bond).
            .command({
              command: ['reassociate'],
              describe: 'Reassociate records with new bond.',
              builder: yargs => yargs
                .option('old-bond-id', { type: 'string' })
                .option('new-bond-id', { type: 'string' }),

              handler: asyncHandler(async argv => {
                const { oldBondId, newBondId } = argv;
                assert(oldBondId, 'Invalid Old Bond ID.');
                assert(newBondId, 'Invalid New Bond ID.');

                const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const result = await registry.reassociateRecords(oldBondId, newBondId, privateKey);
                log(JSON.stringify(result, undefined, 2));
              })
            })
        })
    })
});
