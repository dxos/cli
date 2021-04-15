//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';

import { log } from '@dxos/debug';

export const CONTAINER_PREFIX = 'dxos_';

const docker = new Docker();

export class DockerContainer {
  static async find (filter) {
    const { imageName, name } = filter;

    assert(imageName || name);

    const image = imageName ? (imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`) : undefined;

    return new Promise((resolve, reject) => {
      docker.listContainers({ all: true }, (err, containers) => {
        if (err) {
          return reject(err);
        }
        const containerInfo = containers.find(info => (name && info.Names.includes(`/${CONTAINER_PREFIX}${name}`)) || (!name && image && info.Image === image));
        resolve(containerInfo
          ? new DockerContainer(docker.getContainer(containerInfo.Id))
          : null);
      });
    });
  }

  static async list () {
    return new Promise((resolve, reject) => {
      docker.listContainers({ all: true }, (err, containers) => {
        if (err) {
          return reject(err);
        }
        const dockerContainers = containers
          .filter(info => !!info.Names.find(name => name.startsWith(`/${CONTAINER_PREFIX}`)))
          .map(containerInfo => new DockerContainer(docker.getContainer(containerInfo.Id)));

        resolve(dockerContainers);
      });
    });
  }

  constructor (container) {
    assert(container);

    this._container = container;
    this._started = container.State === 'running';
  }

  async start () {
    if (!this._started) {
      return new Promise((resolve, reject) => {
        this._container.start({}, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async logs (tail = 100, follow = false) {
    return new Promise((resolve, reject) => {
      this._container.logs({ stdout: true, stderr: true, follow, tail }, (err, logs) => {
        if (err) {
          return reject(err);
        }

        if (!follow) {
          log(logs.toString('utf8'));
        } else {
          logs.on('data', chunk => log(chunk.toString('utf8')));
          logs.on('end', resolve);
        }
      });
    });
  }

  async stop () {
    return this._container.stop();
  }
}
