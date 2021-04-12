//
// Copyright 2020 DXOS.org
//

import Docker from 'dockerode';
import yaml from 'js-yaml';

// TODO(egorgripasov): Extend with default values, etc.
export const getImageInfo = (image) => yaml.load(image);

export class DockerImage {
  constructor (options) {
    const { imageName, ports, args, auth } = options;

    this._imageName = imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`;

    this._ports = ports;
    this._args = args || [];
    this._auth = auth;

    this._docker = new Docker();
  }

  async pull (force = false) {
    if (await this.imageExists() && !force) {
      return this._docker.getImage(this._imageName);
    }

    return new Promise((resolve, reject) => {
      this._docker.pull(this._imageName, { authconfig: this._auth }, (err, stream) => {
        if (err) {
          reject(err);
        }
        if (!stream) {
          throw new Error(`Image '${this._imageName}' doesn't exists`);
        }

        this._docker.modem.followProgress(stream, (error, output) => {
          if (error) {
            reject(error);
          }
          resolve(this._docker.getImage(this._imageName));
        }, () => {});
      });
    });
  }

  async imageExists () {
    const images = await this._docker.listImages({ filters: { reference: [this._imageName] } });
    return images.length > 0;
  }

  async createContainer () {
    if (!(await this.imageExists())) {
      throw new Error(`Image '${this._imageName}' doesn't exists`);
    }

    return new Promise((resolve, reject) => {
      this._docker.createContainer({
        // TODO(egorgripasov): Add volumes.
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
          resolve(container);
        });
      });
    });
  }
}
