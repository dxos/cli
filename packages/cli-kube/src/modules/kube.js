//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import path from 'path';

import { RUNNING_STATE, asyncHandler, DockerContainer, DockerImage, Runnable, print } from '@dxos/cli-core';

import { DigitalOceanProvider } from '../providers';

const KubeServices = readFileSync(path.join(__dirname, '../services.yml')).toString();
const compose = readFileSync(path.join(__dirname, '../docker-compose.yml')).toString();

const KUBE_PROFILE_ROOT = '.wire/kube';
const KUBE_PROFILE_PATH = path.join(os.homedir(), KUBE_PROFILE_ROOT);
const DEFAULT_FQDN = 'kube.local';

const kubeCompose = yaml.load(compose);
const defaultServices = yaml.load(KubeServices);

const getAuth = (config, imageInfo) => ({
  username: config.get('services.machine.githubUsername'),
  password: config.get('services.machine.githubAccessToken'),
  serveraddress: `https://${imageInfo.image.split('/')[0]}`
});

const capitalize = (str) => {
  return str[0].toUpperCase() + str.slice(1);
};

export const KubeModule = ({ config }) => ({
  command: ['kube'],
  describe: 'KUBE management.',
  builder: yargs => yargs

    .command({
      command: ['install'],
      describe: 'Install KUBE.',
      builder: yargs => yargs
        .option('force', { type: 'boolean', default: false, description: 'Force install' })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' }),

      handler: asyncHandler(async argv => {
        const { auth: authRequired, force } = argv;
        const { services: { kube } } = kubeCompose;

        const auth = authRequired ? getAuth(config, kube) : undefined;

        const dockerImage = new DockerImage({ service: kube, auth });
        await dockerImage.pull(force);
      })
    })

    .command({
      command: ['upgrade'],
      describe: 'Upgrade KUBE.',
      builder: yargs => yargs
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' }),

      handler: asyncHandler(async argv => {
        const { auth: authRequired } = argv;
        const { services: { kube } } = kubeCompose;

        const auth = authRequired ? getAuth(config, kube) : undefined;

        const { image: imageName } = kube;

        const container = await DockerContainer.find({ imageName });
        if (container && container.started) {
          throw new Error('Unable to upgrade KUBE while it\'s running.');
        }

        const dockerImage = new DockerImage({ service: kube, auth });
        await dockerImage.pull(true);

        await DockerImage.cleanNotLatest(imageName);
      })
    })

    .command({
      command: ['start'],
      describe: 'Run KUBE.',
      builder: yargs => yargs
        .option('key-phrase', { type: 'string', description: 'KUBE OTP keyphrase.' })
        .option('services', { describe: 'Services to run.', type: 'string', default: JSON.stringify(defaultServices) })
        .option('name', { type: 'string', description: 'Container name' })
        .option('fqdn', { type: 'string', description: 'Fully Qualified Domain Name.', default: DEFAULT_FQDN })
        .option('letsencrypt', { type: 'boolean', default: false })
        .option('email', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const containers = await DockerContainer.list();
        const runningContainer = containers.find(container => container.state === RUNNING_STATE);

        if (runningContainer) {
          throw new Error('Please stop any previously started DXOS service before startign the KUBE. `dx kube stop` command could be used.');
        }

        const { services: { kube: service } } = kubeCompose;

        const { name = service.container_name, keyPhrase, services, fqdn, letsencrypt, email } = argv;

        const dockerImage = new DockerImage({ service });

        const binds = [
          '/var/run/docker.sock:/var/run/docker.sock:rw',
          `${KUBE_PROFILE_PATH}/config:/root/.wire/kube:rw`,
          `${KUBE_PROFILE_PATH}/storage:/root/.wire/storage:rw`
        ];

        // TODO(egorgripasov): Rm hardcoded WIRE.
        const env = [
          `WIRE_APP_SERVER_KEYPHRASE=${keyPhrase}`,
          `WIRE_SERVICES=${services}`,
          `HOST_OS=${capitalize(process.platform)}`,
          `KUBE_PROFILE_PATH=${KUBE_PROFILE_PATH}`,
          `KUBE_FQDN=${fqdn}`
        ];

        if (letsencrypt && email) {
          env.push(`LETS_ENCRYPT_EMAIL=${email}`);
        }

        const container = await dockerImage.getOrCreateContainer(name, undefined, env, binds, true);
        await container.start();
      })
    })

    .command({
      command: ['stop'],
      describe: 'Stop KUBE.',
      builder: yargs => yargs
        .option('cleanup', { type: 'boolean', description: 'Remove containers.', default: false }),

      handler: asyncHandler(async argv => {
        const { cleanup } = argv;

        const containers = await DockerContainer.list();
        const runningContainers = containers.filter(container => container.state === RUNNING_STATE);

        await Promise.all(runningContainers.map(async container => {
          await container.stop();
          if (cleanup) {
            await container.destroy();
          }
        }));
      })
    })

    .command({
      command: ['deploy'],
      describe: 'Deploy KUBE to supported Cloud Provider.',
      builder: yargs => yargs
        .option('name', { type: 'string' })
        .option('memory', { type: 'number' })
        .option('region', { type: 'string' })
        .option('pin', { type: 'boolean', default: false })
        .option('register', { type: 'boolean', default: false })
        .option('letsencrypt', { type: 'boolean', default: false })
        .option('email', { type: 'string' })
        .option('key-phrase', { type: 'string' })
        .option('services', { describe: 'Services to run.', type: 'string', default: JSON.stringify(defaultServices) })
        .option('ssh-keys', { type: 'array' }),

      handler: asyncHandler(async argv => {
        const { name, memory, region, pin, register, letsencrypt, email, keyPhrase, services, sshKeys, json } = argv;

        // TODO(egorgripasov): Multiple providers.
        const provider = new DigitalOceanProvider(config);

        const result = await provider.deploy({ name, memory, region, pin, register, letsencrypt, email, keyPhrase, services, sshKeys });
        print(result, { json });
      })
    })

    .command({
      command: ['get'],
      describe: 'Get deployed KUBEs info.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { name, json } = argv;

        // TODO(egorgripasov): Multiple providers.
        const provider = new DigitalOceanProvider(config);
        const result = await provider.get(name);
        if (result) {
          print(result, { json });
        }
      })
    })

    .command({
      command: ['list'],
      describe: 'List deployed KUBEs.',

      handler: asyncHandler(async argv => {
        const { json } = argv;

        // TODO(egorgripasov): Multiple providers.
        const provider = new DigitalOceanProvider(config);
        const result = await provider.list();
        print(result, { json });
      })
    })

    .command({
      command: ['delete'],
      describe: 'Delete deployed KUBEs.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { name } = argv;

        // TODO(egorgripasov): Multiple providers.
        const provider = new DigitalOceanProvider(config);
        await provider.delete(name);
      })
    })

    .command({
      command: ['assemble'],
      describe: 'Install CLI extensions and Services required for running KUBE.',
      builder: yargs => yargs.version(false)
        .option('version', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { version } = argv;

        const scriptRunnable = new Runnable(path.join(__dirname, '../../../scripts/install.sh'));
        const options = {
          detached: false
        };

        scriptRunnable.run([version], options);
      })
    })
});
