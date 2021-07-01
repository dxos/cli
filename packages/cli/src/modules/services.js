//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import {
  RUNNING_STATE,
  DockerContainer,
  DockerImage,
  asyncHandler,
  print,
  listServices,
  getLogs,
  restartService,
  stopService,
  mapConfigToEnv,
  DockerVolume
} from '@dxos/cli-core';

import { Pluggable } from '../pluggable';

const DEFAULT_LOG_LINES = 100;
const DEFAULT_CONFIG_PATH = '/Users/root/.wire/profile/local.yml';

const SERVICE_DAEMON = 'daemon';
const SERVICE_CONTAINER = 'container';

const getServiceInfo = (moduleName, serviceName) => {
  assert(moduleName, 'Invalid extension.');

  const pluggable = new Pluggable({ moduleName });
  if (!pluggable.installed) {
    throw new Error(`Extension '${moduleName}' is not installed.`);
  }
  const compose = pluggable.getDockerCompose();
  assert(compose, `Extension '${moduleName}' does not provide containers.`);
  // TODO(egorgripasov): Docker compose?
  const service = compose.services[serviceName];
  assert(service, `Service ${serviceName} not found in compose file.`);
  return service;
};

const getAuth = (config, imageInfo) => ({
  username: config.get('services.machine.githubUsername'),
  password: config.get('services.machine.githubAccessToken'),
  serveraddress: `https://${imageInfo.image.split('/')[0]}`
});

const getServiceType = async (serviceName) => {
  const { services = [] } = await listServices();
  return (services.map(({ name }) => name).includes(serviceName)) ? SERVICE_DAEMON : SERVICE_CONTAINER;
};

/**
 * Services CLI module.
 * @returns {object}
 */
export const ServicesModule = ({ config, profilePath }) => ({
  command: ['service'],
  describe: 'KUBE service management.',

  handler: asyncHandler(async argv => {
    const { json } = argv;
    const { services } = await listServices();

    const containers = await DockerContainer.list();

    const containerService = await Promise.all(containers.map(async container => ({
      name: container.name,
      exec: container.image,
      status: container.state === RUNNING_STATE ? 'online' : container.state,
      ports: container.ports
        .filter(port => port.PublicPort)
        .map(port => port.PublicPort)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join(','),
      ...(await container.stats()),
      type: SERVICE_CONTAINER
    })));

    const result = services
      .map(service => ({ ...service, type: SERVICE_DAEMON }))
      .concat(containerService)
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

    print(result, { json });
  }),

  builder: yargs => yargs
    .command({
      command: ['install'],
      describe: 'Install service from container.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to install', required: true })
        .option('force', { type: 'boolean', default: false, description: 'Force install' })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, auth: authRequired, force } = argv;

        const service = getServiceInfo(moduleName, serviceName);
        const auth = authRequired ? getAuth(config, service) : undefined;

        const dockerImage = new DockerImage({ service, auth });

        await dockerImage.pull(force);
      })
    })

    .command({
      command: ['upgrade'],
      describe: 'Upgrade service container.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to upgrade', required: true })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, auth: authRequired } = argv;

        const service = getServiceInfo(moduleName, serviceName);
        const auth = authRequired ? getAuth(config, service) : undefined;

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
      describe: 'Start service container.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to install', required: true })
        .option('name', { type: 'string', description: 'Container name' })
        .option('profile-path', { type: 'string', description: 'Profile to pass to container.', default: profilePath })
        .option('forward-env', { type: 'boolean', description: 'Forward ENV', default: false })
        .option('host-net', { type: 'boolean', description: 'Use host network', default: false }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, forward, forwardEnv, hostNet, profilePath: profile } = argv;

        const service = getServiceInfo(moduleName, serviceName);
        const dockerImage = new DockerImage({ service });

        const forwardArgs = forward ? JSON.parse(forward).args : [];
        const command = service.command.split(' ').concat(forwardArgs);

        const { name = service.container_name } = argv;

        assert(name, 'Service name is required.');

        // TODO(egorgripasov): Share volumes between services.
        const volumes = (service.volumes || [])
          .map(volume => volume.split(':')).filter(vol => vol.length === 2);

        let env;
        if (forwardEnv) {
          env = Object.entries(process.env).map(([key, value]) => `${key}=${value}`);
        } else {
          env = Object.entries(mapConfigToEnv(config)).map(([key, value]) => `${key}=${value}`);
        }

        const binds = [
          `${profile}:${DEFAULT_CONFIG_PATH}`
        ];

        const container = await dockerImage.getOrCreateContainer(name, command, env, binds, hostNet, volumes);
        await container.start();
      })
    })

    // Get logs.
    .command({
      command: ['logs [name]'],
      describe: 'Fetch logs.',
      builder: yargs => yargs
        .option('name')
        .option('lines', { type: 'number', default: DEFAULT_LOG_LINES })
        .option('follow', { alias: 'f', type: 'boolean' })
        .option('log-file')
        .option('running-only', { default: false }),

      handler: asyncHandler(async argv => {
        const { name, lines, runningOnly, logFile, follow } = argv;

        assert(name, 'Invalid Service Name.');

        const serviceType = await getServiceType(name);
        if (serviceType === SERVICE_DAEMON) {
          await getLogs(name, { lines, runningOnly, logFile, follow });
        } else {
          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.logs(lines, follow);
        }
      })
    })

    // Restart.
    .command({
      command: ['restart [name]'],
      describe: 'Restart serice.',
      builder: yargs => yargs
        .option('name'),

      handler: asyncHandler(async argv => {
        const { name } = argv;

        assert(name, 'Invalid Service Name.');

        const serviceType = await getServiceType(name);
        if (serviceType === SERVICE_DAEMON) {
          await restartService(name);
        } else {
          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.restart();
        }
      })
    })

    // Stop.
    .command({
      command: ['stop [name]'],
      describe: 'Stop service.',
      builder: yargs => yargs
        .option('name'),

      handler: asyncHandler(async argv => {
        const { name } = argv;

        assert(name, 'Invalid Service Name.');

        const serviceType = await getServiceType(name);
        if (serviceType === SERVICE_DAEMON) {
          await stopService(name);
        } else {
          const container = await DockerContainer.find({ name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.stop();
        }
      })
    })

    .command({
      command: ['reset'],
      describe: 'Reset storage for specific service.',
      builder: yargs => yargs
        .option('name', { describe: 'Service name' })
        .option('volume', { describe: 'Volume name' }),

      handler: asyncHandler(async argv => {
        const { name, volume, json } = argv;

        const container = await DockerContainer.find({ name });
        if (!container) {
          throw new Error(`Unable to find "${name}" service.`);
        }

        let volumesToDelete = await Promise.all(Object.keys(container.volumes)
          .filter(vol => !volume || vol === volume)
          .map(async vol => DockerVolume.get(vol, name))
        );

        // Kill service container before removing volume.
        volumesToDelete = volumesToDelete.filter(volume => !!volume);
        if (volumesToDelete.length) {
          await container.destroy();

          await Promise.all(volumesToDelete.map(async volume => {
            if (volume) {
              await volume.remove();
            }
          }));
        }
        print(volumesToDelete.map(vol => vol.name), { json });
      })
    })
});
