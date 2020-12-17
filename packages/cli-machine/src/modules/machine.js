//
// Copyright 2020 DXOS.org
//

// TODO(dboreham):
//   Move meat into handlers dir
//   Figure out how to log from a cli program

import assert from 'assert';
import crypto from 'crypto';

import DigitalOcean from 'do-wrapper';

import { waitForCondition } from '@dxos/async';
import { asyncHandler, print, getGasAndFees } from '@dxos/cli-core';
import { Registry } from '@wirelineio/registry-client';

const KUBE_TYPE = 'wrn:kube';
const DEFAULT_WRN_ROOT = 'wrn://dxos';
let running = false;

/**
 * @param {DigitalOceanSession} session
 * @param {string} name
 * @return {string} - id for box named name
 */
const getDropletIdFromName = async (session, name) => {
  assert(session);
  assert(name);
  const result = await session.droplets.getAll();
  const [targetDroplet] = result.droplets.filter(droplet => droplet.name === name) || [];
  return targetDroplet ? targetDroplet.id : undefined;
};

/**
 * @param {DigitalOceanSession} session
 * @param {string} domain
 * @param {string} name
 * @return {string} - id for box named name
 */
const getRecordIdFromName = async (session, domain, name) => {
  assert(session);
  assert(domain);
  assert(name);
  const result = await session.domains.getAllRecords(domain, KUBE_TYPE);
  const [target] = result.domain_records.filter(record => record.name === name) || [];
  return target ? target.id : undefined;
};

/**
 * Machine CLI module.
 */
export const MachineModule = ({ config }) => {
  const doAccessToken = config.get('services.machine.doAccessToken');
  const email = config.get('services.machine.email');
  const githubAccessToken = config.get('services.machine.githubAccessToken');
  const dnsDomain = config.get('services.machine.dnsDomain');
  // TODO(dboreham): Get from profile
  const sshKeys = [
    'ec:e0:6b:82:1e:b2:b7:74:a2:c3:1b:b4:3c:6d:72:a0', // David
    'b1:a9:fa:63:0d:60:d5:6c:31:76:37:52:c7:fe:02:0b', // Thomas
    '5f:82:c0:88:68:41:26:1b:d7:9f:be:82:24:7c:29:e3', // Egor
    '15:f7:37:d4:34:79:38:6d:97:e9:fe:bc:ae:3c:03:ae' // Alex
  ];

  return ({
    command: ['machine'],
    describe: 'Machine CLI.',
    builder: yargs => yargs

      .command({
        command: ['list'],
        describe: 'List Machines.',
        builder: yargs => yargs,

        handler: asyncHandler(async () => {
          const { verbose } = yargs.argv;

          const session = new DigitalOcean(doAccessToken, 100);
          const result = await session.droplets.getAll(KUBE_TYPE);

          if (verbose) {
            print({ result }, { json: true });
          }

          const machines = result.droplets.map((droplet) => {
            return {
              name: droplet.name,
              created_at: droplet.created_at,
              memory: droplet.memory,
              vcpus: droplet.vcpus,
              ip_address: droplet.networks.v4.find(net => net.type === 'public').ip_address,
              fqdn: `${droplet.name}.${dnsDomain}`
            };
          });

          print({ machines }, { json: true });
        })
      })
      .command({
        command: ['delete'],
        describe: 'Delete a Machine.',
        builder: yargs => yargs
          .option('name', { type: 'string', require: true })
          .option('verbose', { type: 'boolean', default: false })
          .option('wrn-root', { type: 'string', default: DEFAULT_WRN_ROOT }),

        handler: asyncHandler(async () => {
          if (running) {
            // TODO(telackey): Why is this double-executing?!
            await waitForCondition(() => !running);
            return;
          }
          running = true;

          const { name, wrnRoot, verbose } = yargs.argv;
          const session = new DigitalOcean(doAccessToken, 100);

          verbose && print('Removing machine...');
          const dropletId = await getDropletIdFromName(session, name);
          if (dropletId) {
            try {
              await session.droplets.deleteById(dropletId);
            } catch (e) {}
          }

          verbose && print('Removing DNS record...');
          const recordId = await getRecordIdFromName(session, dnsDomain, name);
          if (recordId) {
            try {
              await session.domains.deleteRecord(dnsDomain, recordId);
            } catch (e) {}
          }

          const wnsConfig = config.get('services.wns');
          const { server, userKey, bondId, chainId } = wnsConfig;
          if (server && userKey && bondId && chainId) {
            const registry = new Registry(server, chainId);
            const fee = getGasAndFees(yargs.argv, wnsConfig);
            try {
              verbose && print('Removing ipfs service record...');
              await registry.deleteName(`${wrnRoot}/service/ipfs/${name}`, userKey, fee);
            } catch (e) {}
            try {
              verbose && print('Removing bot-factory service record...');
              await registry.deleteName(`${wrnRoot}/service/bot-factory/${name}`, userKey, fee);
            } catch (e) {}
            try {
              verbose && print('Removing kube record...');
              await registry.deleteName(`${wrnRoot}/kube/${name}`, userKey, fee);
            } catch (e) {}
          }

          running = false;
        })
      })
      .command({
        command: ['info'],
        describe: 'Info about a Machine.',
        builder: yargs => yargs
          .option('name', { type: 'string', required: true }),

        handler: asyncHandler(async () => {
          const { name } = yargs.argv;
          const session = new DigitalOcean(doAccessToken, 100);

          let machine = {};
          const dropletId = await getDropletIdFromName(session, name);

          if (dropletId) {
            const { droplet } = await session.droplets.getById(dropletId);
            machine = {
              name: droplet.name,
              created_at: droplet.created_at,
              memory: droplet.memory,
              vcpus: droplet.vcpus,
              ip_address: droplet.networks.v4.find(net => net.type === 'public').ip_address,
              fqdn: `${name}.${dnsDomain}`
            };
          }

          print({ machine }, { json: true });
        })
      })
      .command({
        command: ['create'],
        describe: 'Create a Machine.',
        builder: yargs => yargs
          .option('name', { type: 'string' })
          .option('wrn-root', { type: 'string', default: DEFAULT_WRN_ROOT })
          .option('memory', { type: 'number', default: 4 })
          .option('pin', { type: 'boolean', default: false })
          .option('register', { type: 'boolean', default: false })
          .option('cliver', { type: 'string', default: '' })
          .option('dns-ttl', { type: 'number', default: 300 })
          .option('letsencrypt', { type: 'boolean', default: false })
          .option('extension', { type: 'array', default: [] })
          .option('email', { type: 'string', default: email }),

        handler: asyncHandler(async () => {
          if (running) {
            // TODO(telackey): Why is this double-executing?!
            await waitForCondition(() => !running);
            return;
          }

          running = true;

          const { verbose, pin, cliver, letsencrypt, memory, email, register, wrnRoot, dnsTtl, extension } = yargs.argv;
          if (letsencrypt) {
            assert(email, '--email is required with --letsencrypt');
          }

          const radicle = !!extension.find(entry => entry === 'dxos/radicle-seed-node');

          const wnsConfig = config.get('services.wns');
          const { server, userKey, bondId, chainId } = wnsConfig;
          if (register) {
            assert(server && userKey && bondId && chainId, 'Missing WNS config.');
          }

          const session = new DigitalOcean(doAccessToken, 100);

          const boxName = yargs.argv.name ? yargs.argv.name : `kube${crypto.randomBytes(4).toString('hex')}`;
          const boxFullyQualifiedName = `${boxName}.${dnsDomain}`;

          const dropletId = await getDropletIdFromName(session, boxName);
          if (dropletId) {
            throw new Error(`${boxName} already exists`);
          }

          // docker apt source sauce from: https://stackoverflow.com/a/62706447
          // Note that we can't install docker-compose as an apt package because we'll get an old version from the base OS repository
          const cloudConfigScript =
         `#cloud-config

         package_update: true

         package_upgrade: true

         packages:
           - python
           - build-essential
           - python-certbot-apache
           - docker-ce
           - docker-ce-cli

         apt:
           sources:
             certbot:
               source: "ppa:certbot/certbot"
             docker.list:
               source: deb [arch=amd64] https://download.docker.com/linux/ubuntu $RELEASE stable
               keyid: 9DC858229FC7DD38854AE2D88D81803C0EBFCD88

         runcmd:
           - curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
           - chmod +x /usr/local/bin/docker-compose
           - git clone https://${githubAccessToken}@github.com/dxos/kube.git kube
           - cd kube
           - cd ..
           - cp -r kube /opt
           - echo "export KUBE_FQDN=${boxFullyQualifiedName}" >> /opt/kube/etc/kube.env
           - echo "export KUBE_PIN_WNS_OBJECTS=${pin ? 1 : 0}" >> /opt/kube/etc/kube.env
           - cd /opt/kube/scripts
           - sed -i 's/run_installer "ssh" install_ssh_key/#run_installer "ssh" install_ssh_key/g' install.sh
           - sed -i 's/apt clean//g' install.sh
           - sed -i 's/apt autoclean//g' install.sh
           - sed -i 's/apt autoremove//g' install.sh
           - export WIRE_CLI_VER="${cliver}"
           - if [ ! -z "${cliver}" ]; then sed -i "s/'latest'/'${cliver.replace('@', '')}'/g" /opt/kube/local.yml; fi
           - export HOME=/root
           - ./install.sh /opt
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /root/.wire/remote.yml
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /etc/apache2/sites-available/000-default.conf
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /etc/apache2/sites-available/default-ssl.conf
           - cp ./conf/systemd/kube.service /etc/systemd/system
           - systemctl enable kube
           - systemctl start kube
           - if [ "${letsencrypt ? 1 : 0}" = "1" ]; then certbot --apache -d ${boxFullyQualifiedName} -n --agree-tos -m ${email}; fi
           - sleep 2
           - /etc/init.d/apache2 restart
           - cd /opt/kube/scripts
           - export WIRE_WNS_ENDPOINT=${server}
           - export WIRE_WNS_USER_KEY=${userKey}
           - export WIRE_WNS_BOND_ID=${bondId}
           - if [ "${register ? 1 : 0}" = "1" ]; then while [ ! -f "$HOME/.wire/bots/service.yml" ]; do sleep 1; done; fi
           - if [ "${register ? 1 : 0}" = "1" ]; then ./ipfs_auto_publish.sh "${wrnRoot}/service/ipfs/${boxName}" "${boxFullyQualifiedName}"; fi
           - if [ "${register ? 1 : 0}" = "1" ]; then ./botfactory_auto_publish.sh "${wrnRoot}/service/bot-factory/${boxName}" "${boxFullyQualifiedName}"; fi
           - if [ "${radicle ? 1 : 0}" = "1" ]; then docker run -d --restart=always -p 8889:8889 -p 12345:12345/udp -e 'PUBLIC_ADDR=${boxFullyQualifiedName}:12345' dxos/radicle-seed-node; fi
        `;

          // from https://developers.digitalocean.com/documentation/changelog/api-v2/new-size-slugs-for-droplet-plan-changes/
          let sizeSlug = 's-2vcpu-4gb';
          switch (memory) {
            case 1:
              sizeSlug = 's-1vcpu-1gb';
              break;
            case 2:
              sizeSlug = 's-2vcpu-2gb';
              break;
            case 4:
              sizeSlug = 's-2vcpu-4gb';
              break;
            case 8:
              sizeSlug = 's-4vcpu-8gb';
              break;
            case 16:
              sizeSlug = 's-8vcpu-16gb';
              break;
            case 32:
              sizeSlug = 's-8vcpu-32gb';
              break;
            default:
              print(`Unsupported memory size specified: ${yargs.argv.memory}, using default 4G size instead.`);
          }

          const createParameters = {
            name: boxName,
            region: 'nyc3',
            size: sizeSlug,
            image: 'ubuntu-18-04-x64',
            ssh_keys: sshKeys,
            user_data: cloudConfigScript,
            tags: [KUBE_TYPE]
          };

          if (verbose) {
            print({ createParameters }, { json: true });
          }

          const result = await session.droplets.create(createParameters);
          const droplet = await waitForCondition(async () => {
            const { droplet } = await session.droplets.getById(result.droplet.id);
            if (droplet?.networks.v4.find(net => net.type === 'public').ip_address) {
              return droplet;
            }
            return undefined;
          }, 0, 1000);

          if (verbose) {
            print({ droplet }, { json: true });
          }

          const ipAddress = droplet.networks.v4.find(net => net.type === 'public').ip_address;
          const dnsResult = await session.domains.createRecord(dnsDomain, {
            type: 'A',
            name: boxName,
            data: ipAddress,
            ttl: dnsTtl,
            tags: [KUBE_TYPE]
          });

          if (verbose) {
            print({ dnsResult }, { json: true });
          }

          const machine = {
            name: droplet.name,
            created_at: droplet.created_at,
            memory: droplet.memory,
            vcpus: droplet.vcpus,
            ip_address: ipAddress,
            fqdn: boxFullyQualifiedName
          };

          print({ machine }, { json: true });

          if (register) {
            const registry = new Registry(server, chainId);
            const boxRecord = {
              type: KUBE_TYPE,
              name: boxName,
              url: `https://${boxFullyQualifiedName}`,
              version: '1.0.0'
            };

            const fee = getGasAndFees(yargs.argv, wnsConfig);
            const result = await registry.setRecord(userKey, boxRecord, undefined, bondId, fee);
            await registry.setName(`${wrnRoot}/kube/${boxName}`, result.data, userKey, fee);
            print({ record: result.data, wrn: `${wrnRoot}/kube/${boxName}` }, { json: true });
          }

          running = false;
        })
      })
  });
};
