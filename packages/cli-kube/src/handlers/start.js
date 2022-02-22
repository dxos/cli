//
// Copyright 2021 DXOS.org
//

import os from 'os';
import path from 'path';

import { RUNNING_STATE, SERVICES_STORE, DockerContainer, DockerImage } from '@dxos/cli-core';

import { overrideServices } from '../utils/override';

const KUBE_PROFILE_ROOT = '.dx/kube';
const KUBE_PROFILE_PATH = path.join(os.homedir(), KUBE_PROFILE_ROOT);

const KUBE_SERVICES_PATH = path.join(os.homedir(), SERVICES_STORE);

const capitalize = (str) => {
  return str[0].toUpperCase() + str.slice(1);
};

export const start = ({ kubeCompose }) => async (argv) => {
  const containers = await DockerContainer.list();
  const runningContainer = containers.find(container => container.state === RUNNING_STATE);

  if (runningContainer) {
    throw new Error('Please stop any previously started DXOS service before startign the KUBE. `dx kube stop` command could be used.');
  }

  const { services: { kube: service } } = kubeCompose;

  const { name = service.container_name, keyPhrase, services, servicesOverride, fqdn, letsencrypt, email, dev } = argv;

  const dockerImage = new DockerImage({ service, dev });

  const binds = [
    '/var/run/docker.sock:/var/run/docker.sock:rw',
    `${KUBE_PROFILE_PATH}/config:/root/.dx/kube:rw`,
    `${KUBE_PROFILE_PATH}/storage:/root/.dx/storage:rw`,
    `${KUBE_SERVICES_PATH}:/root/.dx/services:rw`
  ];

  const servicesToRun = overrideServices(services, servicesOverride);

  const env = [
    `DX_APP_SERVER_KEYPHRASE=${keyPhrase}`,
    `DX_SERVICES=${servicesToRun}`,
    `HOST_OS=${capitalize(process.platform)}`,
    `KUBE_PROFILE_PATH=${KUBE_PROFILE_PATH}`,
    `KUBE_FQDN=${fqdn}`,
    `KUBE_DEV_MODE=${dev ? '1' : '0'}`
  ];

  if (letsencrypt && email) {
    env.push(`LETS_ENCRYPT_EMAIL=${email}`);
  }

  const container = await dockerImage.getOrCreateContainer({ name, env, binds, hostNet: true });
  await container.start();
};
