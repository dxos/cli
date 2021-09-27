//
// Copyright 2021 DXOS.org
//

import os from 'os';
import path from 'path';

import { RUNNING_STATE, DockerContainer, DockerImage } from '@dxos/cli-core';

const KUBE_PROFILE_ROOT = '.wire/kube';
const KUBE_PROFILE_PATH = path.join(os.homedir(), KUBE_PROFILE_ROOT);

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

  const { name = service.container_name, keyPhrase, services, fqdn, letsencrypt, email, dev } = argv;

  const dockerImage = new DockerImage({ service, dev });

  const binds = [
    '/var/run/docker.sock:/var/run/docker.sock:rw',
    `${KUBE_PROFILE_PATH}/config:/root/.wire/kube:rw`,
    `${KUBE_PROFILE_PATH}/storage:/root/.wire/storage:rw`
  ];

  // TODO(egorgripasov): Rm hardcoded WIRE.
  const env = [
    `WIRE_APP_SERVER_KEYPHRASE=${keyPhrase}`,
    `WIRE_SERVICES=${services}`,
    `HOST_OS=${capitalize(process.platform)}`,
    `KUBE_PROFILE_PATH=${KUBE_PROFILE_PATH}`,
    `KUBE_FQDN=${fqdn}`,
    `KUBE_DEV_MODE=${dev ? '1' : '0'}`
  ];

  if (letsencrypt && email) {
    env.push(`LETS_ENCRYPT_EMAIL=${email}`);
  }

  const container = await dockerImage.getOrCreateContainer(name, undefined, env, binds, true);
  await container.start();
};
