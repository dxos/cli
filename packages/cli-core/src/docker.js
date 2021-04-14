//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';
import yaml from 'js-yaml';

import { log } from '@dxos/debug';

const docker = new Docker();

// TODO(egorgripasov): Extend with default values, etc.
export const getImageInfo = (image) => yaml.load(image);

export class DockerImage {
  constructor (options) {
    const { imageName, name, ports, args, auth } = options;

    assert(imageName);

    this._imageName = imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`;
    this._name = name;

    this._ports = ports;
    this._args = args || [];
    this._auth = auth;
  }

  async pull (force = false) {
    if (await this.imageExists() && !force) {
      return docker.getImage(this._imageName);
    }

    return new Promise((resolve, reject) => {
      docker.pull(this._imageName, { authconfig: this._auth }, (err, stream) => {
        if (err) {
          reject(err);
        }
        if (!stream) {
          throw new Error(`Auth credentials are invalid or Image '${this._imageName}' doesn't exists.`);
        }

        docker.modem.followProgress(stream, (error, output) => {
          if (error) {
            reject(error);
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

  async createContainer () {
    if (!(await this.imageExists())) {
      throw new Error(`Image '${this._imageName}' doesn't exists.`);
    }

    return new Promise((resolve, reject) => {
      docker.createContainer({
        // TODO(egorgripasov): Add volumes.
        name: this._name,
        Image: this._imageName,
        Tty: true,
        ExposedPorts: Object.entries(this._ports).reduce((acc, [key]) => {
          acc[key] = {};
          return acc;
        }, {}),
        HostConfig: {
          PortBindings: Object.entries(this._ports).reduce((acc, [key, value]) => {
            acc[key] = [{
              HostPort: value
            }];
            return acc;
          }, {})
        },
        Cmd: this._args
      }, (err, container) => {
        if (err) {
          reject(err);
        }
        container.start({}, (err) => {
          if (err) {
            reject(err);
          }
          resolve(new DockerContainer(container));
        });
      });
    });
  }
}

export class DockerContainer {
  static async find (filter) {
    const { imageName, name } = filter;

    assert(imageName || name);

    const image = imageName ? (imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`) : undefined;
    // TODO(egorgripasov): Running same container multiple times, i.e. find by Name.
    return new Promise((resolve, reject) => {
      docker.listContainers((err, containers) => {
        if (err) {
          reject(err);
        }
        const containerInfo = containers.find(info => (name && info.Names.includes(`/${name}`)) || (image && info.Image === image));
        resolve(new DockerContainer(docker.getContainer(containerInfo.Id)));
      });
    });
  }

  constructor (container) {
    assert(container);

    this._container = container;
  }

  async logs (tail = 100, follow = false) {
    return new Promise((resolve, reject) => {
      this._container.logs({ stdout: true, stderr: true, follow, tail }, (err, logs) => {
        if (err) {
          reject(err);
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
