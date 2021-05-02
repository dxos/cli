//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';
import yaml from 'js-yaml';
import hash from 'object-hash';

import { CONTAINER_PREFIX, DockerContainer } from './container';

const docker = new Docker();

const LATEST_TAG = 'latest';
const HOST_NETWORK_MODE = 'host';

// TODO(egorgripasov): Extend with default values, etc.
export const getImageInfo = (image) => yaml.load(image);

export class DockerImage {
  static async cleanNotLatest (imageName) {
    assert(imageName);

    imageName = imageName.split(':')[0];
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    const outdatedImages = images.filter(image => !image.RepoTags || !image.RepoTags.includes(`${imageName}:${LATEST_TAG}`));

    for await (const outdatedImage of outdatedImages) {
      const containers = await DockerContainer.list({ id: outdatedImage.Id });
      for await (const container of containers) {
        await container.destroy();
      }

      await docker.getImage(outdatedImage.Id).remove({ force: true });
    }
  }

  constructor (options) {
    const { service, auth } = options;
    const { image: imageName, ports, command, network_mode: networkMode } = service;

    assert(imageName);
    assert(command);

    this._imageName = imageName.indexOf(':') > 0 ? imageName : `${imageName}:${LATEST_TAG}`;

    this._networkMode = networkMode;
    this._ports = ports;
    this._command = command;
    this._auth = auth;
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

        docker.modem.followProgress(stream, (err) => {
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

  async getOrCreateContainer (name, args, env = null, binds = [], hostNet = false) {
    // TODO(egorgripasov): Forward logs to /var/logs?
    if (!(await this.imageExists())) {
      throw new Error(`Image '${this._imageName}' doesn't exists.`);
    }

    args = args || this._command.splt(' ');

    const configHash = hash({ args, env, hostNet });

    const container = await DockerContainer.find({ imageName: this._imageName, name });
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

    return new Promise((resolve, reject) => {
      docker.createContainer({
        // TODO(egorgripasov): Add volumes.
        name: `${CONTAINER_PREFIX}${name}`,
        Image: this._imageName,
        Labels: {
          configHash
        },
        Tty: true,
        ...(env ? { Env: env } : {}),
        ...(this._ports && !hostNet ? {
          ExposedPorts: Object.entries(Object.assign(...this._ports)).reduce((acc, [key]) => {
            acc[key] = {};
            return acc;
          }, {})
        } : {}),
        HostConfig: {
          RestartPolicy: {
            Name: 'unless-stopped'
          },
          Binds: binds,
          ...(this._networkMode === HOST_NETWORK_MODE || hostNet ? { NetworkMode: HOST_NETWORK_MODE } : {}),
          ...(this._ports && !hostNet ? {
            PortBindings: Object.entries(Object.assign(...this._ports)).reduce((acc, [key, value]) => {
              acc[key] = [{
                HostPort: value
              }];
              return acc;
            }, {})
          } : {})
        },
        Cmd: args
      }, (err) => {
        if (err) {
          return reject(err);
        }

        DockerContainer.find({ imageName: this._imageName, name }).then(container => resolve(container));
      });
    });
  }
}
