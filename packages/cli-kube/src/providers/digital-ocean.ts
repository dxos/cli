//
// Copyright 2021 DXOS.org
//

import crypto from 'crypto';
import DigitalOcean from 'do-wrapper';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';

import { KUBE_TAG, KubeDeployOptions, KubeDomainCreateOptions, Provider } from './common';

const SSH_KEYS = readFileSync(path.join(__dirname, '../ssh-keys.yml')).toString();
const { keys: sshKeys } = yaml.load(SSH_KEYS);

const DEFAULT_REGION = 'nyc3';
const DEFAULT_MEMORY = 4;

export class DigitalOceanProvider implements Provider {
  _config: any;
  _session: any;

  constructor (config: any) {
    this._config = config;

    const doAccessToken = config.get('services.machine.doAccessToken');
    this._session = new DigitalOcean(doAccessToken, 100);
  }

  async deploy (options: KubeDeployOptions) {
    // const email = this._config.get('services.machine.email');
    const githubAccessToken = this._config.get('services.machine.githubAccessToken');
    const githubUsername = this._config.get('services.machine.githubUsername');
    const npmAccessToken = this._config.get('services.machine.npmAccessToken');
    // const dnsDomain = this._config.get('services.machine.dnsDomain');

    const { name = `kube-${crypto.randomBytes(4).toString('hex')}`, region = DEFAULT_REGION, memory = DEFAULT_MEMORY, keyPhrase, fqdn, letsencrypt, email /*, register, pin, services */ } = options;

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
           - sudo apt-get install -y nodejs
           - export HOME=/root
           - echo "//registry.npmjs.org/:_authToken=${npmAccessToken}" >> $HOME/.npmrc
           - npm install --global yarn
           - yarn global add @dxos/cli@alpha
           - dx profile init --name moon --template-url https://git.io/Jnmus
           - dx profile set moon
           - dx extension install @dxos/cli-kube --version alpha
           - dx extension install @dxos/cli-dxns --version alpha
           - dx extension install @dxos/cli-app --version alpha
           - dx extension install @dxos/cli-signal --version alpha
           - export WIRE_MACHINE_GITHUB_USERNAME=${githubUsername}
           - export WIRE_MACHINE_GITHUB_TOKEN=${githubAccessToken}
           - dx kube install --auth
           - dx service install --from @dxos/cli-app --service app-server --auth
           - dx service install --from @dxos/cli-dxns --service dxns --auth
           - dx service install --from @dxos/cli-signal --service signal --auth
           - systemctl disable apache2 && systemctl stop apache2
           - dx kube start --key-phrase="${keyPhrase}" --fqdn="${fqdn}" --letsencrypt=${letsencrypt} --email="${email}"
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
    return result;
  }

  async createDNS (options: KubeDomainCreateOptions) {
    console.log(options);
  }
}
