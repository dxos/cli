//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';
import yaml from 'js-yaml';

import { CONTAINER_PREFIX, DockerContainer } from './container';

const docker = new Docker();

// TODO(egorgripasov): Extend with default values, etc.
export const getImageInfo = (image) => yaml.load(image);

export class DockerImage {
  constructor (options) {
    const { imageName, ports, args, auth } = options;

    assert(imageName);

    this._imageName = imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`;

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

  async getOrCreateContainer (name, args = []) {
    // TODO(egorgripasov): Forward logs to /var/logs?
    if (!(await this.imageExists())) {
      throw new Error(`Image '${this._imageName}' doesn't exists.`);
    }

    const container = await DockerContainer.find({ imageName: this._imageName, name });
    if (container) {
      return container;
    }

    return new Promise((resolve, reject) => {
      docker.createContainer({
        // TODO(egorgripasov): Add volumes.
        name: `${CONTAINER_PREFIX}${name}`,
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
        Cmd: [...this._args, ...args]
      }, (err, container) => {
        if (err) {
          return reject(err);
        }
        resolve(new DockerContainer(container));
      });
    });
  }
}
