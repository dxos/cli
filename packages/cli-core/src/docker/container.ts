//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import Docker, { Container } from 'dockerode';

import { log } from '@dxos/debug';

export const CONTAINER_PREFIX = 'dxos_';
export const RUNNING_STATE = 'running';

const docker = new Docker();

type ContainerFilter = {
  imageName?: string,
  name?: string
}

export class DockerContainer {
  _container: Container;
  _containerInfo: any;
  _started: boolean;
  _name: string;

  static async find (filter: ContainerFilter): Promise<DockerContainer | null> {
    const { imageName, name } = filter;

    assert(imageName || name);

    const image = imageName ? (imageName.indexOf(':') > 0 ? imageName : `${imageName}:latest`) : undefined;

    return new Promise((resolve, reject) => {
      docker.listContainers({ all: true }, (err, containers) => {
        if (err) {
          return reject(err);
        }
        const containerInfo = containers!.find(info => (name && info.Names.includes(`/${CONTAINER_PREFIX}${name}`)) || (!name && image && info.Image === image));
        resolve(containerInfo
          ? new DockerContainer(docker.getContainer(containerInfo.Id), containerInfo)
          : null);
      });
    });
  }

  static async list (options: any = {}): Promise<Array<DockerContainer>> {
    const { id } = options;

    return new Promise((resolve, reject) => {
      docker.listContainers({ all: true }, (err, containers) => {
        if (err) {
          return reject(err);
        }
        const dockerContainers = containers!
          .filter(info => (!id || (id && info.Image === id)) && !!info.Names.find(name => name.startsWith(`/${CONTAINER_PREFIX}`)))
          .map(containerInfo => new DockerContainer(docker.getContainer(containerInfo.Id), containerInfo));

        resolve(dockerContainers);
      });
    });
  }

  constructor (container: Container, containerInfo: any) {
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

  get volumes () {
    const volumesMapping = JSON.parse(this._containerInfo.Labels.volumeLabel);
    return this._containerInfo.Mounts
      .filter((vol: any) => vol.Name && vol.Type === 'volume' && volumesMapping[vol.Name])
      .reduce((acc: any, vol: any) => {
        acc[volumesMapping[vol.Name]] = { fullName: vol.Name, target: vol.Destination };
        return acc;
      }, {});
  }

  async start () {
    if (!this._started) {
      return new Promise<void>((resolve, reject) => {
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
          log(logs!.toString());
        } else {
          logs!.on('data', chunk => log(chunk.toString()));
          logs!.on('end', resolve);
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
      cpu: Math.round(cpuPercent * 100) / 100,
      // https://docs.docker.com/engine/api/v1.41/#operation/ContainerStats
      memory: memory_stats.stats && memory_stats.usage ? memory_stats.usage - memory_stats.stats.cache : 0
    };
  }

  async destroy () {
    await this._container.remove({ force: true });
  }
}
