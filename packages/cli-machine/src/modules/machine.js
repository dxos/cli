//
// Copyright 2020 DXOS.org
//

// TODO(dboreham):
//   Move meat into handlers dir
//   Figure out how to log from a cli program

import assert from 'assert';
import crypto from 'crypto';

import DigitalOcean from 'do-wrapper';

import { asyncHandler, print, getGasAndFees } from '@dxos/cli-core';
import { Registry } from '@wirelineio/registry-client';

const KUBE_TYPE = 'wrn:kube';

/**
 *
 * @param {DigitalOceanSession} session
 * @param {string} name
 * @return {string} - id for box named name
 */
const getIdFromName = async (session, name) => {
  assert(session);
  assert(name);
  const result = await session.droplets.getAll();
  const targetDroplet = result.droplets.filter((droplet) => { return droplet.name === name; });
  return targetDroplet[0].id;
};

/**
 * Machine CLI module.
 */
export const MachineModule = ({ config }) => {
  const doAccessToken = config.get('services.machine.doAccessToken');
  const githubAccessToken = config.get('services.machine.githubAccessToken');
  const dnsDomain = config.get('services.machine.dnsDomain');
  // TODO(dboreham): Get from profile
  const sshKeys = ['ec:e0:6b:82:1e:b2:b7:74:a2:c3:1b:b4:3c:6d:72:a0', 'b1:a9:fa:63:0d:60:d5:6c:31:76:37:52:c7:fe:02:0b'];

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
          const result = await session.droplets.getAll();

          if (verbose) {
            print({ result }, { json: true });
          }

          const boxesRaw = result.droplets.filter((droplet) => { return droplet.name.startsWith('kube'); });
          const machines = boxesRaw.map((droplet) => {
            return { name: droplet.name, created_at: droplet.created_at };
          });

          print({ machines }, { json: true });
        })
      })
      .command({
        command: ['publish'],
        describe: 'Publish a machine.',
        builder: yargs => yargs
          .option('name', { type: 'string' })
          .option('gas', { type: 'string' })
          .option('fees', { type: 'string' }),

        handler: asyncHandler(async (argv) => {
          const { verbose } = yargs.argv;

          const boxName = yargs.argv.name;
          const fullyQualifiedBoxName = `${boxName}.${dnsDomain}`;
          const wnsBoxName = `${dnsDomain}/${boxName}`;

          const session = new DigitalOcean(doAccessToken, 100);

          const dropletId = await getIdFromName(session, yargs.argv.name);

          const dropletInfo = await session.droplets.getById(dropletId);

          const ipAddress = dropletInfo.droplet.networks.v4.find(net => net.type === 'public').ip_address;

          const dnsResult = await session.domains.createRecord(dnsDomain,
            { type: 'A', name: boxName, data: ipAddress });

          if (verbose) {
            print({ dnsResult }, { json: true });
          }

          const wnsConfig = config.get('services.wns');
          const { server, userKey, bondId, chainId } = wnsConfig;
          const registry = new Registry(server, chainId);

          const version = '1.0.0';

          const boxRecord = {
            type: KUBE_TYPE,
            name: wnsBoxName,
            url: `https://${fullyQualifiedBoxName}`,
            version
          };

          const fee = getGasAndFees(argv, wnsConfig);
          const result = await registry.setRecord(userKey, boxRecord, undefined, bondId, fee);

          const machineData = {
            name: boxName,
            dns_name: fullyQualifiedBoxName,
            wns_record_id: result.data
          };

          print({ machine_data: machineData }, { json: true });
        })
      })
      .command({
        command: ['info'],
        describe: 'Info about a Machine.',
        builder: yargs => yargs
          .option('name', { type: 'string' }),

        handler: asyncHandler(async () => {
          const session = new DigitalOcean(doAccessToken, 100);

          const dropletId = await getIdFromName(session, yargs.argv.name);

          const { droplet: dropletInfo } = await session.droplets.getById(dropletId);

          const kube = {
            name: dropletInfo.name,
            ip_address: dropletInfo.networks.v4[0].ip_address
          };

          print({ kube }, { json: true });
        })
      })
      .command({
        command: ['create'],
        describe: 'Create a Machine.',
        builder: yargs => yargs
          .option('name', { type: 'string' })
          .option('pin', { type: 'boolean', default: false }),

        handler: asyncHandler(async () => {
          const { verbose, pin } = yargs.argv;

          const session = new DigitalOcean(doAccessToken, 100);

          const boxName = yargs.argv.name ? yargs.argv.name : `kube${crypto.randomBytes(4).toString('hex')}`;
          const boxFullyQualifiedName = `${boxName}.${dnsDomain}`;

          // docker apt source sauce from: https://stackoverflow.com/a/62706447
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
           - docker-compose

         apt:
           sources:
             certbot:
               source: "ppa:certbot/certbot"
             docker.list:
               source: deb [arch=amd64] https://download.docker.com/linux/ubuntu $RELEASE stable
               keyid: 9DC858229FC7DD38854AE2D88D81803C0EBFCD88

         runcmd:
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
           - export HOME=/root
           - ./install.sh /opt
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /root/.wire/remote.yml
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /etc/apache2/sites-available/000-default.conf
           - sed -i s/kube.local/${boxFullyQualifiedName}/g /etc/apache2/sites-available/default-ssl.conf
           - cp ./conf/systemd/kube.service /etc/systemd/system
           - systemctl enable kube
           - systemctl start kube
        `;

          const createParameters = {
            name: boxName,
            region: 'nyc3',
            size: 's-2vcpu-4gb',
            image: 'ubuntu-18-04-x64',
            ssh_keys: sshKeys,
            user_data: cloudConfigScript
          };

          if (verbose) {
            print({ createParameters }, { json: true });
          }

          const result = await session.droplets.create(createParameters);

          if (verbose) {
            print({ result }, { json: true });
          }

          const machine = {
            name: boxName
          };

          print({ machine }, { json: true });
        })
      })
  });
};
