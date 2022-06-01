//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import hash from 'object-hash';
import os from 'os';
import path from 'path';

import { ensureServicesStore } from '../config';
import { CONTAINER_PREFIX, DockerContainer } from './container';
import { DockerVolume } from './volume';

export const LATEST_TAG = 'latest';
export const DEV_TAG = 'dev';

const docker = new Docker();

const HOST_NETWORK_MODE = 'host';

type ContainerSettings = {
  name: string,
  args?: Array<any>,
  env?: any,
  binds?: any,
  hostNet?: boolean,
  volumes?: any,
  restore?: boolean,
};

// TODO(burdon): Not used?
// TODO(egorgripasov): Extend with default values, etc.
export const getImageInfo = (image: string) => yaml.load(image);

export class DockerImage {
  _imageName: string;
  _networkMode: any;
  _ports: any;
  _command: string;
  _auth: any;
  _hostname: string;
  _envFiles: string[];

  static async cleanNotLatest (imageName: string) {
    assert(imageName);

    imageName = imageName.split(':')[0];
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    const outdatedImages = images.filter(image => !image.RepoTags || (!image.RepoTags?.includes(`${imageName}:${DEV_TAG}`) && !image.RepoTags?.includes(`${imageName}:${LATEST_TAG}`)));

    for await (const outdatedImage of outdatedImages) {
      const containers: Array<DockerContainer> = await DockerContainer.list({ id: outdatedImage.Id });
      for await (const container of containers) {
        await container.destroy();
      }

      await docker.getImage(outdatedImage.Id).remove({ force: true });
    }
  }

  constructor (options: any) {
    const { service, auth, dev } = options;
    // eslint-disable-next-line camelcase
    const { image: imageName, ports, command, network_mode: networkMode, hostname, env_file = [] } = service;

    assert(imageName);
    assert(command);

    const tag = dev ? DEV_TAG : LATEST_TAG;
    this._imageName = `${imageName.split(':')[0]}:${tag}`;

    this._networkMode = networkMode;
    this._ports = ports;
    this._command = command;
    this._auth = auth;
    this._hostname = hostname;
    // eslint-disable-next-line camelcase
    this._envFiles = env_file;
  }

  async pull (force = false) {
    if (await this.imageExists() && !force) {
      return docker.getImage(this._imageName);
    }

    return new Promise((resolve, reject) => {
      docker.pull(this._imageName, { authconfig: this._auth }, (err, stream) => {
        if (err) {
          return reject(err);
        }
        if (!stream) {
          throw new Error(`Auth credentials are invalid or Image '${this._imageName}' doesn't exists.`);
        }

        docker.modem.followProgress(stream, (err: Error | null) => {
          if (err) {
            return reject(err);
          }
          resolve(docker.getImage(this._imageName));
        }, () => {});
      });
    });
  }

  async imageExists () {
    const images = await docker.listImages({ filters: { reference: [this._imageName] } });
    return images.length > 0;
  }

  async getOrCreateContainer (containerSettings: ContainerSettings): Promise<DockerContainer> {
    const { name, restore = false } = containerSettings;
    const serviceStartInfo = ensureServicesStore(name);

    let { args, env = null, binds = [], hostNet = false, volumes = [] } = restore ? JSON.parse(readFileSync(serviceStartInfo, { encoding: 'utf-8' })) : containerSettings;

    if (!restore) {
      // Read env files if any (assuming should exists if provided).
      this._envFiles.forEach(envFile => {
        const envFilePath = envFile.startsWith('~')
          ? envFile.replace('~', os.homedir())
          : path.join(process.cwd(), envFile);

        if (!existsSync(envFilePath)) {
          throw new Error(`${envFile} env file does not exists.`);
        }
        const envs = readFileSync(envFilePath, 'utf8').toString().split('\n').filter(line => line);
        env = (env || []).concat(envs);
      });
      // Store args for service restart.
      writeFileSync(serviceStartInfo, JSON.stringify({ name, args, env, binds, hostNet, volumes }), { encoding: 'utf-8' });
    }

    // TODO(egorgripasov): Forward logs to /var/logs?
    if (!(await this.imageExists())) {
      throw new Error(`Image '${this._imageName}' doesn't exists.`);
    }

    hostNet = hostNet && process.platform !== 'darwin';

    args = args || this._command.split(' ');

    const configHash = hash({ args, env, hostNet, volumes, binds });

    const container: DockerContainer | null = await DockerContainer.find({ imageName: this._imageName, name });
    if (container) {
      if (container.started) {
        throw new Error(`Service '${name}' is already running.`);
      }

      if (configHash === container.labels.configHash) {
        return container;
      }

      // If command is different, rm container.
      await container.destroy();
    }

    // Create volumes if required.
    const imageVolumes: any = {};
    const volumeLabel: any = {};
    const volumeBinds = await Promise.all(volumes.map(async (vol: any) => {
      const [volumeName, target] = vol;
      const volume = await DockerVolume.getOrCreate(volumeName, name) as DockerVolume;
      imageVolumes[target] = {};
      volumeLabel[volume.fullName] = volume.name;
      return `${volume.fullName}:${target}`;
    }));

    return new Promise((resolve, reject) => {
      docker.createContainer({
        name: `${CONTAINER_PREFIX}${name}`,
        Image: this._imageName,
        Labels: {
          configHash,
          volumeLabel: JSON.stringify(volumeLabel)
        },
        Tty: true,
        ...(this._hostname ? { Hostname: this._hostname } : {}),
        ...(env ? { Env: env } : {}),
        ...(this._ports && !hostNet
          ? {
              ExposedPorts: Object.entries(Object.assign({}, ...this._ports)).reduce((acc: any, [key]) => {
                acc[key] = {};
                return acc;
              }, {})
            }
          : {}
        ),
        Volumes: imageVolumes,
        HostConfig: {
          RestartPolicy: {
            Name: 'unless-stopped'
          },
          Binds: [
            ...binds,
            ...volumeBinds
          ],
          ...(this._networkMode === HOST_NETWORK_MODE || hostNet ? { NetworkMode: HOST_NETWORK_MODE } : {}),
          ...(this._ports && !hostNet
            ? {
                PortBindings: Object.entries(Object.assign({}, ...this._ports)).reduce((acc: any, [key, value]) => {
                  acc[key] = [{
                    HostPort: value
                  }];
                  return acc;
                }, {})
              }
            : {}
          )
        },
        Cmd: args
      }, (err) => {
        if (err) {
          return reject(err);
        }
        // eslint-disable-next-line
        DockerContainer.find({ imageName: this._imageName, name }).then(container => resolve(container!));
      });
    });
  }
}
