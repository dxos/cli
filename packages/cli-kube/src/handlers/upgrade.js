//
// Copyright 2021 DXOS.org
//

import { DockerImage, DockerContainer } from '@dxos/cli-core';

export const upgrade = (config, { getAuth, kubeCompose }) => async ({ auth: authRequired, dev }) => {
  const { services: { kube } } = kubeCompose;

  const auth = authRequired ? getAuth(config, kube) : undefined;

  const { image: imageName } = kube;

  const container = await DockerContainer.find({ imageName, dev });
  if (container && container.started) {
    throw new Error('Unable to upgrade KUBE while it\'s running.');
  }

  const dockerImage = new DockerImage({ service: kube, auth, dev });
  await dockerImage.pull(true);

  await DockerImage.cleanNotLatest(imageName);
};
