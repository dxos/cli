//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import path from 'path';
import kill from 'tree-kill';
import { spawn, spawnSync } from 'child_process';
import clean from 'lodash-clean';
import yaml from 'node-yaml';
import inquirer from 'inquirer';
import url from 'url';
import { ensureFileSync, removeSync, ensureDir } from 'fs-extra';
import fs from 'fs';
import os from 'os';
import get from 'lodash.get';
import set from 'lodash.set';

import {
  Runnable,
  stopService,
  asyncHandler,
  getActiveProfilePath,
  getGasAndFees
} from '@dxos/cli-core';

import { log } from '@dxos/debug';
import { Registry, Account, createBid } from '@wirelineio/registry-client';

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

const OUT_DIR = 'out';

const getConnectionInfo = (argv, config) => {
  const { server, userKey, bondId, txKey, chainId, fees, gas } = argv;

  const result = {
    ...config,
    ...clean({ server, userKey, bondId, txKey, chainId }),
    privateKey: txKey || userKey || config.userKey,
    gas: String(gas || config.gas),
    fees: String(fees || config.fees)
  };

  return result;
};

const readJSONFile = (filePath) => {
  assert(filePath, 'Invalid file path.');

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath));
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

    .option('gas', { type: 'string' })
    .option('fees', { type: 'string' })

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
        const { variables = '{}', filename } = argv;

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
            const { txKey, filename, verbose } = argv;
            const wnsConfig = config.get('services.wns');
            const { server, userKey, bondId, chainId } = getConnectionInfo(argv, wnsConfig);

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
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.setRecord(userKey, record, txKey, bondId, fee);

            log(verbose ? JSON.stringify(result, undefined, 2) : result.data);
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
            .option('bond-id', { type: 'string' })
            .option('type', { type: 'string' })
            .option('name', { type: 'string' })
            .option('all', { type: 'boolean', default: false }),

          handler: asyncHandler(async argv => {
            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            const { type, name, bondId, all } = argv;

            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const result = await registry.queryRecords({ bondId, type, name }, all);
            log(JSON.stringify(result, undefined, 2));
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
            const wnsConfig = config.get('services.wns');
            const { server, userKey, bondId, chainId } = getConnectionInfo(argv, wnsConfig);

            assert(server, 'Invalid WNS endpoint.');
            assert(!userKey, 'User key already exists.');
            assert(!bondId, 'Bond already exists.');
            assert(chainId, 'Invalid WNS Chain ID.');

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

            const registry = new Registry(server, chainId);
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
            const fee = getGasAndFees(argv, wnsConfig);
            await registry.createBond([{ denom: FAUCET_TOKEN, amount: FAUCET_AMOUNT }], privateKey, fee);
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
            let { address } = argv;

            const { server, privateKey, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            if (!address && privateKey) {
              address = new Account(Buffer.from(privateKey, 'hex')).getCosmosAddress();
            }

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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const account = new Account(Buffer.from(privateKey, 'hex'));
            const fromAddress = account.formattedCosmosAddress;

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            await registry.sendCoins([{ denom, amount }], toAddress, privateKey, fee);
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
            const { type: denom, quantity: amount, verbose } = argv;

            assert(denom, 'Invalid Type.');
            assert(amount, 'Invalid Quantity.');

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.createBond([{ denom, amount }], privateKey, fee);
            log(verbose ? JSON.stringify(result, undefined, 2) : result.data);
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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.refillBond(id, [{ denom, amount }], privateKey, fee);
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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.withdrawBond(id, [{ denom, amount }], privateKey, fee);
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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.cancelBond(id, privateKey, fee);
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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.associateBond(id, bondId, privateKey, fee);
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

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.dissociateBond(id, privateKey, fee);
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

                const wnsConfig = config.get('services.wns');
                const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const fee = getGasAndFees(argv, wnsConfig);
                const result = await registry.dissociateRecords(bondId, privateKey, fee);
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

                const wnsConfig = config.get('services.wns');
                const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const fee = getGasAndFees(argv, wnsConfig);
                const result = await registry.reassociateRecords(oldBondId, newBondId, privateKey, fee);
                log(JSON.stringify(result, undefined, 2));
              })
            })
        })
    })

    .command({
      command: ['auction'],
      describe: 'Auction operations.',
      builder: yargs => yargs
        .command({
          command: ['get [id]'],
          describe: 'Get auction information.',
          handler: asyncHandler(async argv => {
            const { id } = argv;
            assert(id, 'Invalid auction ID.');

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.getAuctionsByIds([id]);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['bid'],
          describe: 'Auction bid operations.',
          builder: yargs => yargs
            .option('auction-id', { type: 'string' })
            .option('type', { type: 'string' })
            .option('quantity', { type: 'string' })
            .option('file-path', { type: 'string' })

            .command({
              command: ['commit [auction-id] [quantity] [type]'],
              describe: 'Commit auction bid.',
              handler: asyncHandler(async argv => {
                const { auctionId, quantity, type: denom } = argv;
                assert(auctionId, 'Invalid auction ID.');
                assert(quantity, 'Invalid token quantity.');
                assert(denom, 'Invalid token type.');

                const wnsConfig = config.get('services.wns');
                const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const account = new Account(Buffer.from(privateKey, 'hex'));
                const bidderAddress = account.formattedCosmosAddress;
                const bidAmount = `${quantity}${denom}`;
                const { reveal, commitHash } = await createBid(chainId, auctionId, bidderAddress, bidAmount);

                // Save reveal file.
                const outDirPath = path.join(process.cwd(), OUT_DIR);
                const revealFilePath = path.join(outDirPath, `${commitHash}.json`);
                await ensureDir(outDirPath);
                fs.writeFileSync(revealFilePath, JSON.stringify(reveal, undefined, 2));

                const registry = new Registry(server, chainId);
                const fee = getGasAndFees(argv, wnsConfig);

                const result = await registry.commitBid(auctionId, commitHash, privateKey, fee);
                log(JSON.stringify(result, undefined, 2));

                log(`\nReveal file: ${revealFilePath}`);
              })
            })

            .command({
              command: ['reveal [auction-id] [file-path]'],
              describe: 'Reveal auction bid.',
              handler: asyncHandler(async argv => {
                const { auctionId, filePath } = argv;
                assert(auctionId, 'Invalid auction ID.');
                assert(filePath, 'Invalid reveal file path.');

                const wnsConfig = config.get('services.wns');
                const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
                assert(server, 'Invalid WNS endpoint.');
                assert(privateKey, 'Invalid Transaction Key.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const fee = getGasAndFees(argv, wnsConfig);

                const reveal = fs.readFileSync(path.resolve(filePath));
                const result = await registry.revealBid(auctionId, reveal.toString('hex'), privateKey, fee);
                log(JSON.stringify(result, undefined, 2));
              })
            })
        })
    })

    .command({
      command: ['authority'],
      describe: 'Name authority operations.',
      builder: yargs => yargs
        .command({
          command: ['reserve [name]'],
          describe: 'Reserve authority/name.',
          builder: yargs => yargs
            .option('owner', { type: 'string', default: '' }),

          handler: asyncHandler(async argv => {
            const { name, owner } = argv;
            assert(name, 'Invalid authority name.');

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);

            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.reserveAuthority(name, privateKey, fee, owner);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['whois [name]'],
          describe: 'Lookup authority information.',
          handler: asyncHandler(async argv => {
            const { name } = argv;
            assert(name, 'Invalid authority name.');

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.lookupAuthorities([name], true);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['bond'],
          describe: 'Authority bond operations.',
          builder: yargs => yargs

            .command({
              command: ['set [name] [bond-id]'],
              describe: 'Set bond for authority.',
              handler: asyncHandler(async argv => {
                const { name, bondId } = argv;
                assert(name, 'Invalid authority name.');
                assert(bondId, 'Invalid Bond ID.');

                const wnsConfig = config.get('services.wns');
                const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);
                assert(server, 'Invalid WNS endpoint.');
                assert(chainId, 'Invalid WNS Chain ID.');

                const registry = new Registry(server, chainId);
                const fee = getGasAndFees(argv, wnsConfig);
                const result = await registry.setAuthorityBond(name, bondId, privateKey, fee);
                log(JSON.stringify(result, undefined, 2));
              })
            })
        })
    })

    .command({
      command: ['name'],
      describe: 'Name operations.',
      builder: yargs => yargs
        .command({
          command: ['set [name] [id]'],
          describe: 'Set name (create name to record ID mapping).',
          handler: asyncHandler(async argv => {
            const { name, id } = argv;
            assert(name, 'Invalid Name.');
            assert(id, 'Invalid Record ID.');

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);

            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.setName(name, id, privateKey, fee);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['delete [name]'],
          describe: 'Delete name (remove name to record ID mapping).',
          handler: asyncHandler(async argv => {
            const { name } = argv;
            assert(name, 'Invalid Name.');

            const wnsConfig = config.get('services.wns');
            const { server, privateKey, chainId } = getConnectionInfo(argv, wnsConfig);

            assert(server, 'Invalid WNS endpoint.');
            assert(privateKey, 'Invalid Transaction Key.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(argv, wnsConfig);
            const result = await registry.deleteName(name, privateKey, fee);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['lookup [name]'],
          describe: 'Lookup name information.',
          builder: yargs => yargs
            .option('history', { type: 'boolean' }),

          handler: asyncHandler(async argv => {
            const { name, history } = argv;
            assert(name, 'Invalid Name.');

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);
            const result = await registry.lookupNames([name], history);

            log(JSON.stringify(result, undefined, 2));
          })
        })

        .command({
          command: ['resolve [name]'],
          describe: 'Resolve name to record.',
          handler: asyncHandler(async argv => {
            const { name } = argv;

            const { server, chainId } = getConnectionInfo(argv, config.get('services.wns'));
            assert(server, 'Invalid WNS endpoint.');
            assert(chainId, 'Invalid WNS Chain ID.');

            const registry = new Registry(server, chainId);

            const result = await registry.resolveNames([name]);
            log(JSON.stringify(result, undefined, 4));
          })
        })
    })

    .command({
      command: ['migrate'],
      describe: 'WNS chain migration tools.',
      builder: yargs => yargs
        .option('from-file', { type: 'string' })
        .option('to-file', { type: 'string' })

        .command({
          command: ['accounts'],
          describe: 'Migrate accounts from exported file to new genesis.json.',
          handler: asyncHandler(async argv => {
            const { fromFile, toFile } = argv;

            const from = readJSONFile(fromFile);
            const to = readJSONFile(toFile);

            const stats = {
              countFromFileAccounts: 0,
              countSkippedModuleAccounts: 0,
              skippedModuleAccounts: [],
              countSkippedExistingAccounts: 0,
              countMigratedAccounts: 0
            };

            stats.countFromFileAccounts = from.app_state.accounts.length;

            const existingAccounts = {};
            to.app_state.accounts.forEach(account => {
              existingAccounts[account.address] = true;
            });

            from.app_state.accounts.forEach(account => {
              if (account.module_name) {
                stats.skippedModuleAccounts.push(account.module_name);
                return stats.countSkippedModuleAccounts++;
              }

              if (existingAccounts[account.address]) {
                return stats.countSkippedExistingAccounts++;
              }

              account.account_number = '0';
              account.sequence_number = '0';
              to.app_state.accounts.push(account);
              stats.countMigratedAccounts++;
            });

            fs.writeFileSync(toFile, JSON.stringify(to, undefined, 2));

            log(JSON.stringify(stats, null, 2));
          })
        })

        .command({
          command: ['bonds'],
          describe: 'Migrate bonds from exported file to new genesis.json.',
          handler: asyncHandler(async argv => {
            const { fromFile, toFile } = argv;

            const from = readJSONFile(fromFile);
            const to = readJSONFile(toFile);

            const stats = {
              countMigratedBonds: from.app_state.bond.bonds.length
            };

            // Copy over all bonds.
            to.app_state.bond.bonds = from.app_state.bond.bonds;

            fs.writeFileSync(toFile, JSON.stringify(to, undefined, 2));

            log(JSON.stringify(stats, null, 2));
          })
        })

        .command({
          command: ['gentx-accounts'],
          describe: 'Update genesis.json with accounts from gentx folder, with initial stake.',
          builder: yargs => yargs
            .option('gentx-folder', { type: 'string' })
            .option('amount', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { gentxFolder, toFile, amount } = argv;

            assert(gentxFolder, 'Invalid gentx folder path.');
            assert(amount, 'Invalid amount.');

            const to = readJSONFile(toFile);

            const stats = {
              countSkippedExistingAccounts: 0,
              countNewAccounts: 0
            };

            const gentxAccounts = [];

            const gentxFiles = fs.readdirSync(gentxFolder);
            gentxFiles.forEach(gentxFile => {
              const gentxFilePath = path.join(gentxFolder, gentxFile);
              const gentx = JSON.parse(fs.readFileSync(gentxFilePath));
              gentxAccounts.push(gentx.value.msg[0].value.delegator_address);
            });

            const existingAccounts = {};
            to.app_state.accounts.forEach(account => {
              existingAccounts[account.address] = true;
            });

            gentxAccounts.forEach(account => {
              if (existingAccounts[account]) {
                return stats.countSkippedExistingAccounts++;
              }

              const newAccount = {
                address: account,
                coins: [
                  {
                    denom: 'uwire',
                    amount
                  }
                ],
                sequence_number: '0',
                account_number: '0',
                original_vesting: [],
                delegated_free: [],
                delegated_vesting: [],
                start_time: '0',
                end_time: '0',
                module_name: '',
                module_permissions: ['']
              };

              to.app_state.accounts.push(newAccount);
              stats.countNewAccounts++;
            });

            fs.writeFileSync(toFile, JSON.stringify(to, undefined, 2));

            log(JSON.stringify(stats, null, 2));
          })
        })

        .command({
          command: ['patch'],
          describe: 'Patch entries in genesis.json.',
          builder: yargs => yargs
            .option('key', { type: 'string' })
            .option('value', { type: 'string' })
            .option('type', { type: 'string' }),

          handler: asyncHandler(async argv => {
            const { fromFile, toFile, key, type: dataType } = argv;
            let { value } = argv;

            switch (dataType) {
              case 'bool': value = (value === 'true'); break;
              case 'int': value = parseInt(value, 10); break;
            }

            const data = readJSONFile(fromFile || toFile);
            set(data, key, value);

            fs.writeFileSync(toFile || fromFile, JSON.stringify(data, undefined, 2));
          })
        })
    })
});
