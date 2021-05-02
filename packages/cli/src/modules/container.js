//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { asyncHandler, print, DockerContainer, DockerImage, mapConfigToEnv } from '@dxos/cli-core';

import { Pluggable } from '../pluggable';

const DEFAULT_LOG_LINES = 100;
const DEFAULT_CONFIG_PATH = '/Users/root/.wire/profile/local.yml';

const getServiceInfo = (moduleName, serviceName) => {
  assert(moduleName, 'Invalid extension.');

  const pluggable = new Pluggable({ moduleName });
  if (!pluggable.installed) {
    throw new Error(`Extension '${moduleName}' is not installed.`);
  }
  const compose = pluggable.getDockerCompose();
  assert(compose, `Extension '${moduleName}' does not provide containers.`);
  // TODO(egorgripasov): Docker compose.
  const service = compose.services[serviceName];
  assert(service, `Service ${serviceName} not found in compose file.`);
  return service;
};

const getAuth = (config, imageInfo) => ({
  username: config.get('services.machine.githubUsername'),
  password: config.get('services.machine.githubAccessToken'),
  serveraddress: `https://${imageInfo.image.split('/')[0]}`
});

/**
 * Container CLI module.
 * @returns {object}
 */
export const ContainerModule = ({ config, profilePath }) => {
  return ({
    command: ['container'],
    describe: 'KUBE container management.',

    builder: yargs => yargs
      .command({
        command: ['install'],
        describe: 'Install container.',
        builder: yargs => yargs
          .option('from', { describe: 'Extension name', required: true })
          .option('service', { describe: 'Service to install', required: true })
          .option('force', { type: 'boolean', default: false, description: 'Force install' }),

        handler: asyncHandler(async argv => {
          const { from: moduleName, service: serviceName, force } = argv;

          const service = getServiceInfo(moduleName, serviceName);
          const auth = getAuth(config, service);

          const dockerImage = new DockerImage({ service, auth });

          await dockerImage.pull(force);
        })
      })

      .command({
        command: ['upgrade'],
        describe: 'Upgrade container.',
        builder: yargs => yargs
          .option('from', { describe: 'Extension name', required: true })
          .option('service', { describe: 'Service to install', required: true }),

        handler: asyncHandler(async argv => {
          const { from: moduleName, service: serviceName } = argv;

          const service = getServiceInfo(moduleName, serviceName);
          const auth = getAuth(config, service);

          const { image: imageName } = service;

          const container = await DockerContainer.find({ imageName });
          if (container && container.started) {
            throw new Error(`Unable to upgrade '${service.container_name}' while it's running.`);
          }

          // TODO(egorgripasov): Already up-to-date message.
          const dockerImage = new DockerImage({ service, auth });
          await dockerImage.pull(true);

          await DockerImage.cleanNotLatest(imageName);
        })
      })

      .command({
        command: ['start'],
        describe: 'Start container.',
        builder: yargs => yargs
          .option('from', { describe: 'Extension name', required: true })
          .option('service', { describe: 'Service to install', required: true })
          .option('name', { type: 'string', description: 'Container name' })
          .option('forward-env', { type: 'boolean', description: 'Forward ENV', default: false })
          .option('host-net', { type: 'boolean', description: 'Use host network', default: false }),

        handler: asyncHandler(async argv => {
          const { from: moduleName, service: serviceName, forward, forwardEnv, hostNet } = argv;

          const service = getServiceInfo(moduleName, serviceName);
          const dockerImage = new DockerImage({ service });

          const forwardArgs = forward ? JSON.parse(forward).args : [];
          const command = service.command.split(' ').concat(forwardArgs);

          const { name = service.container_name } = argv;

          let env;
          if (forwardEnv) {
            env = Object.entries(process.env).map(([key, value]) => `${key}=${value}`);
          } else {
            env = Object.entries(mapConfigToEnv(config)).map(([key, value]) => `${key}=${value}`);
          }

          const binds = [
            `${profilePath}:${DEFAULT_CONFIG_PATH}`
          ];

          const container = await dockerImage.getOrCreateContainer(name, command, env, binds, hostNet);
          await container.start();
        })
      })

      .command({
        command: ['list'],
        describe: 'List containers.',
        builder: yargs => yargs
          .option('name'),

        handler: asyncHandler(async argv => {
          const { json } = argv;

          const containers = await DockerContainer.list();
          print(await Promise.all(containers.map(async container => ({
            name: container.name,
            state: container.state,
            ports: container.ports
              .filter(port => port.PublicPort)
              .map(port => port.PublicPort)
              .filter((value, index, arr) => arr.indexOf(value) === index)
              .join(','),
            ...(await container.stats())
          }))), { json });
        })
      })

      .command({
        command: ['logs [name]'],
        describe: 'Fetch logs.',
        builder: yargs => yargs
          .option('name')
          .option('lines', { alias: 'tail', type: 'number', default: DEFAULT_LOG_LINES })
          .option('follow', { alias: 'f', type: 'boolean', default: false }),

        handler: asyncHandler(async argv => {
          const { name, lines, follow } = argv;

          assert(name, 'Invalid Process Name.');

          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.logs(lines, follow);
        })
      })

      .command({
        command: ['stop [name]'],
        describe: 'Stop service.',
        builder: yargs => yargs
          .option('name'),

        handler: asyncHandler(async argv => {
          const { name } = argv;

          assert(name, 'Invalid Process Name.');

          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.stop();
        })
      })

      .command({
        command: ['restart [name]'],
        describe: 'Restart service.',
        builder: yargs => yargs
          .option('name'),

        handler: asyncHandler(async argv => {
          const { name } = argv;

          assert(name, 'Invalid Process Name.');

          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.restart();
        })
      })
  });
};
