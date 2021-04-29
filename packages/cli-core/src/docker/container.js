//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker from 'dockerode';
import prettyBytes from 'pretty-bytes';

import { log } from '@dxos/debug';

export const CONTAINER_PREFIX = 'dxos_';

const docker = new Docker();

const RUNNING_STATE = 'running';

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
          ? new DockerContainer(docker.getContainer(containerInfo.Id), containerInfo)
          : null);
      });
    });
  }

  static async list (options = {}) {
    const { id } = options;

    return new Promise((resolve, reject) => {
      docker.listContainers({ all: true }, (err, containers) => {
        if (err) {
          return reject(err);
        }
        const dockerContainers = containers
          .filter(info => (!id || (id && info.Image === id)) && !!info.Names.find(name => name.startsWith(`/${CONTAINER_PREFIX}`)))
          .map(containerInfo => new DockerContainer(docker.getContainer(containerInfo.Id), containerInfo));

        resolve(dockerContainers);
      });
    });
  }

  constructor (container, containerInfo) {
    assert(container);
    assert(containerInfo);

    this._container = container;
    this._containerInfo = containerInfo;

    this._started = containerInfo.State === RUNNING_STATE;
    this._name = containerInfo.Names[0].replace(`/${CONTAINER_PREFIX}`, '');
  }

  get name () {
    return this._name;
  }

  get started () {
    return this._started;
  }

  get state () {
    return this._containerInfo.State;
  }

  get ports () {
    return this._containerInfo.Ports;
  }

  get image () {
    return this._containerInfo.Image;
  }

  get labels () {
    return this._containerInfo.Labels;
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

  async restart () {
    return this._container.restart();
  }

  async stats () {
    // eslint-disable-next-line
    const { cpu_stats, precpu_stats, memory_stats } = await this._container.stats({ stream: false });

    let cpuPercent = 0.0;
    const cpuDelta = cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage;
    const systemDelta = cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage;

    if (systemDelta > 0.0 && cpuDelta > 0.0) {
      cpuPercent = (cpuDelta / systemDelta) * cpu_stats.cpu_usage.percpu_usage.length * 100.0;
    }

    return {
      cpu: `${cpuPercent.toFixed(2)}%`,
      memory: memory_stats.stats && memory_stats.stats.active_anon ? prettyBytes(memory_stats.stats.active_anon) : '0'
    };
  }

  async destroy () {
    await this._container.remove({ force: true });
  }
}
