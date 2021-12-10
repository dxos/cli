//
// Copyright 2021 DXOS.org
//

import Docker from 'dockerode';

export const VOLUME_PREFIX = 'dxos';

const docker = new Docker();

export class DockerVolume {
  _volume: any;
  _name: string;
  _fullName: string;

  static async get (name: string, service: string) {
    const prefixedName = `${VOLUME_PREFIX}_${service}_${name}`;
    return new Promise<DockerVolume | void>((resolve, reject) => {
      const volume = docker.getVolume(prefixedName);
      volume.inspect((err) => {
        if (err) {
          if (err.statusCode === 404) {
            resolve();
          } else {
            reject(err);
          }
        } else {
          resolve(new DockerVolume(volume, prefixedName, name));
        }
      });
    });
  }

  static async create (name: string, service: string) {
    const prefixedName = `${VOLUME_PREFIX}_${service}_${name}`;
    return new Promise<DockerVolume | void>((resolve, reject) => {
      docker.createVolume({ Name: prefixedName }, (err, volume) => {
        if (err) {
          reject(err);
        } else {
          resolve(new DockerVolume(volume, prefixedName, name));
        }
      });
    });
  }

  static async getOrCreate (name: string, service: string) {
    let volume = await DockerVolume.get(name, service);
    if (!volume) {
      volume = await DockerVolume.create(name, service);
    }
    return volume;
  }

  constructor (volume: any, fullName: string, name: string) {
    this._volume = volume;
    this._name = name;
    this._fullName = fullName;
  }

  get name () {
    return this._name;
  }

  get fullName () {
    return this._fullName;
  }

  async remove () {
    return new Promise((resolve, reject) => {
      this._volume.remove((err: Error, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}
