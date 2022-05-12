//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import os from 'os';
import path from 'path';

import {
  RUNNING_STATE,
  STORAGE_ROOT,
  ENVS,
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

// TODO(burdon): Convert to TS.
// import type { ConfigObject } from '@dxos/config';

import { Pluggable } from '../system';

const DEFAULT_LOG_LINES = 100;
const DEFAULT_CONFIG_PATH = '/root/.dx/profile/local.yml';
const DEFAULT_STORAGE_PATH = path.join('/root', STORAGE_ROOT);

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

const getAuth = (config/*: ConfigObject*/, imageInfo) => ({
  username: config.get('runtime.services.machine.githubUsername'),
  password: config.get('runtime.services.machine.githubAccessToken'),
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
// TODO(burdon): Move to cli-kube?
export const ServicesModule = ({ config, profilePath }) => ({
  command: ['service'],
  describe: 'DXOS service management.',
  builder: yargs => yargs
    .command({
      command: ['list', '$0'],
      describe: 'List services.',
      builder: yargs => yargs
        .option('usage', { describe: 'Include usage info', type: 'boolean', default: false }),

      handler: asyncHandler(async argv => {
        const { json, usage } = argv;

        const listContainers = async () => {
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
            ...(usage ? (await container.stats()) : { cpu: 0, memory: 0 }),
            type: SERVICE_CONTAINER
          })));

          return containerService;
        };

        const [{ services }, containerService] = await Promise.all([
          await listServices(usage),
          await listContainers()
        ]);

        const result = services
          .map(service => ({ ...service, type: SERVICE_DAEMON }))
          .concat(containerService)
          .sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

        print(result, { json });
      })
    })

    .command({
      command: ['install'],
      describe: 'Install service from container.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to install', required: true })
        .option('force', { type: 'boolean', default: false, description: 'Force install' })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, auth: authRequired, force, dev } = argv;
        const service = getServiceInfo(moduleName, serviceName);
        const auth = authRequired ? getAuth(config, service) : undefined;
        const dockerImage = new DockerImage({ service, auth, dev });
        await dockerImage.pull(force);
      })
    })

    .command({
      command: ['upgrade'],
      describe: 'Upgrade service container.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to upgrade', required: true })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' })
        .option('hot', { type: 'boolean', default: false, description: 'Hot upgrade' })
        .option('name', { type: 'string', description: 'Container name' }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, auth: authRequired, dev, hot } = argv;
        const service = getServiceInfo(moduleName, serviceName);
        const auth = authRequired ? getAuth(config, service) : undefined;
        const { name = service.container_name } = argv;
        const { image: imageName } = service;

        const container = await DockerContainer.find({ imageName, dev });
        const running = container?.started;
        if (running) {
          if (!hot) {
            throw new Error(`Unable to upgrade '${service.container_name}' while it's running.`);
          }

          await container.stop();
        }

        // TODO(egorgripasov): Already up-to-date message.
        const dockerImage = new DockerImage({ service, auth, dev });
        await dockerImage.pull(true);

        await DockerImage.cleanNotLatest(imageName);

        if (running) {
          const newContainer = await dockerImage.getOrCreateContainer({ name, restore: true });
          await newContainer.start();
        }
      })
    })

    .command({
      command: ['restore'],
      describe: 'Restore service from saved state.',
      builder: yargs => yargs
        .option('from', { describe: 'Extension name', required: true })
        .option('service', { describe: 'Service to upgrade', required: true })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' })
        .option('name', { type: 'string', description: 'Container name' }),

      handler: asyncHandler(async argv => {
        const { from: moduleName, service: serviceName, dev } = argv;
        const service = getServiceInfo(moduleName, serviceName);
        const { name = service.container_name } = argv;
        const { image: imageName } = service;

        const container = await DockerContainer.find({ imageName, dev });
        if (container?.started) {
          throw new Error(`Unable to restore '${service.container_name}' while it's running.`);
        }

        const dockerImage = new DockerImage({ service, dev });
        const newContainer = await dockerImage.getOrCreateContainer({ name, restore: true });
        await newContainer.start();
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
        .option('forward-env', { type: 'string', description: 'ENV to forward. Could be "full", "system", "config"' })
        .option('host-net', { type: 'boolean', description: 'Use host network', default: false })
        .option('storage-path', { type: 'string', description: 'Path to ECHO and HALO storage.', default: path.join(os.homedir(), STORAGE_ROOT) })
        .option('binds', { type: 'array', description: 'Additional volume binds.' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' })
        .option('replace-args', { type: 'boolean', description: 'Replace default arguments with provided.', default: false }),

      handler: asyncHandler(async argv => {
        const {
          from: moduleName,
          service: serviceName,
          forward,
          forwardEnv,
          hostNet,
          profilePath: profile,
          storagePath,
          binds: additionalBinds = [],
          dev,
          replaceArgs
        } = argv;
        const service = getServiceInfo(moduleName, serviceName);
        const dockerImage = new DockerImage({ service, dev });
        const forwardArgs = forward ? JSON.parse(forward).args : [];
        const command = replaceArgs ? forwardArgs : service.command.split(' ').concat(forwardArgs);
        const { name = service.container_name } = argv;
        assert(name, 'Service name is required.');

        // TODO(egorgripasov): Share volumes between services.
        const volumes = (service.volumes || [])
          .map(volume => volume.split(':')).filter(vol => vol.length === 2);

        let env;
        switch (forwardEnv) {
          case 'full':
            env = Object.entries(process.env).map(([key, value]) => `${key}=${value}`);
            break;
          case 'system':
            env = Object.entries(process.env).filter(([key]) => ENVS.includes(key)).map(([key, value]) => `${key}=${value}`);
            break;
          case 'config':
            env = Object.entries(mapConfigToEnv(config)).map(([key, value]) => `${key}=${value}`);
            break;
        }

        const binds = [
          `${profile}:${DEFAULT_CONFIG_PATH}`,
          `${storagePath}:${DEFAULT_STORAGE_PATH}:rw`,
          ...additionalBinds
        ];

        const container = await dockerImage.getOrCreateContainer({ name, args: command, env, binds, hostNet, volumes });
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
        assert(name, 'Invalid service name.');

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
        assert(name, 'Invalid service name.');

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
