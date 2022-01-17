//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import crypto from 'crypto';
import DigitalOcean from 'do-wrapper';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';

import { waitForCondition } from '@dxos/async';

import { KUBE_TAG, KubeDeployOptions, KubeDomainCreateOptions, Provider } from './common';

const SSH_KEYS = readFileSync(path.join(__dirname, '../../ssh-keys.yml')).toString();
const { keys: defaultSSHKeys } = yaml.load(SSH_KEYS);

const DEFAULT_REGION = 'nyc3';
const DEFAULT_MEMORY = 4;
const DEFAULT_DNS_TTL = 300;

export class DigitalOceanProvider implements Provider {
  _config: any;
  _session: any;
  _npmAccessToken: string
  _dnsDomain: string

  constructor (config: any) {
    this._config = config;
    this._npmAccessToken = this._config.get('runtime.services.machine.npmAccessToken');
    this._dnsDomain = this._config.get('runtime.services.machine.dnsDomain');

    assert(this._npmAccessToken);
    assert(this._dnsDomain);

    const doAccessToken = config.get('runtime.services.machine.doAccessToken');
    this._session = new DigitalOcean(doAccessToken, 100);
  }

  async getDropletIdFromName (name: string) {
    assert(name);

    const result = await this._session.droplets.getAll();
    const [targetDroplet] = result.droplets.filter((droplet: any) => droplet.name === name) || [];
    return targetDroplet ? targetDroplet.id : undefined;
  }

  async getRecordIdFromName (domain: string, name: string) {
    assert(domain);
    assert(name);

    const result = await this._session.domains.getAllRecords(domain, KUBE_TAG);
    const [target] = result.domain_records.filter((record: any) => record.name === name) || [];
    return target ? target.id : undefined;
  }

  async deploy (options: KubeDeployOptions) {
    const { name = `kube-${crypto.randomBytes(4).toString('hex')}`, region = DEFAULT_REGION, memory = DEFAULT_MEMORY, keyPhrase, letsencrypt, email, sshKeys = defaultSSHKeys, services, dev /*, register, pin */ } = options;
    const fqdn = `${name}.${this._dnsDomain}`;

    const dropletId = await this.getDropletIdFromName(name);
    if (dropletId) {
      throw new Error(`${name} already exists.`);
    }

    const cliChannel = dev ? 'dev' : 'latest';

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
           - curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
           - sudo apt-get install -y nodejs jq
           - export HOME=/root
           - echo "//registry.npmjs.org/:_authToken=${this._npmAccessToken}" >> $HOME/.npmrc
           - npm install --global yarn
           - yarn global add @dxos/cli@${cliChannel}
           - dx profile init --name enterprise --template-url https://bit.ly/3A642xB
           - dx profile set enterprise
           - dx extension install @dxos/cli-kube --version ${cliChannel}
           - dx kube install ${dev ? '--dev' : ''}
           - dx kube assemble ${dev ? '--dev' : ''}
           - systemctl disable apache2 && systemctl stop apache2
           - dx kube start ${dev ? '--dev' : ''} --services='${services}' --key-phrase="${keyPhrase}" --fqdn="${fqdn}" --letsencrypt=${letsencrypt} --email="${email}"
        `;

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
    }

    const createParameters = {
      name,
      region,
      size: sizeSlug,
      image: 'ubuntu-18-04-x64',
      ssh_keys: sshKeys,
      user_data: cloudConfigScript,
      tags: [KUBE_TAG]
    };

    const result = await this._session.droplets.create(createParameters);
    const droplet = await waitForCondition(async () => {
      const { droplet } = await this._session.droplets.getById(result.droplet.id);
      // eslint-disable-next-line camelcase
      if (droplet?.networks.v4.find((net: any) => net.type === 'public').ip_address) {
        return droplet;
      }
      return undefined;
    }, 0, 1000);

    const ipAddress = droplet.networks.v4.find((net: any) => net.type === 'public').ip_address;
    await this._session.domains.createRecord(this._dnsDomain, {
      type: 'A',
      name,
      data: ipAddress,
      ttl: DEFAULT_DNS_TTL,
      tags: [KUBE_TAG]
    });

    return {
      name: droplet.name,
      createdAt: droplet.created_at,
      memory: droplet.memory,
      vcpus: droplet.vcpus,
      ipAddress: ipAddress,
      fqdn
    };
  }

  async createDNS (options: KubeDomainCreateOptions) {
    console.log(options);
  }

  async list () {
    const result = await this._session.droplets.getAll(KUBE_TAG);

    const machines = result.droplets.map((droplet: any) => {
      return {
        name: droplet.name,
        createdAt: droplet.created_at,
        memory: droplet.memory,
        vcpus: droplet.vcpus,
        ipAddress: droplet.networks.v4.find((net: any) => net.type === 'public').ip_address,
        fqdn: `${droplet.name}.${this._dnsDomain}`
      };
    });

    return machines;
  }

  async delete (name: string) {
    const dropletId = await this.getDropletIdFromName(name);
    if (dropletId) {
      try {
        await this._session.droplets.deleteById(dropletId);
      } catch (e) {}
    }

    const recordId = await this.getRecordIdFromName(this._dnsDomain, name);
    if (recordId) {
      try {
        await this._session.domains.deleteRecord(this._dnsDomain, recordId);
      } catch (e) {}
    }
  }

  async get (name: string) {
    const dropletId = await this.getDropletIdFromName(name);
    let kube;
    if (dropletId) {
      const { droplet } = await this._session.droplets.getById(dropletId);
      kube = {
        name: droplet.name,
        createdAt: droplet.created_at,
        memory: droplet.memory,
        vcpus: droplet.vcpus,
        ipAddress: droplet.networks.v4.find((net: any) => net.type === 'public').ip_address,
        fqdn: `${name}.${this._dnsDomain}`
      };
    }
    return kube;
  }
}
