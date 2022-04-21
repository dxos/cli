//
// Copyright 2022 DXOS.org
//

import { DockerImage, DockerContainer } from '@dxos/cli-core';

export const upgrade = (config, { getAuth, kubeCompose }) => async (argv) => {
  const { services: { kube } } = kubeCompose;

  const { auth: authRequired, dev, hot, name = kube.container_name } = argv;

  const auth = authRequired ? getAuth(config, kube) : undefined;

  const { image: imageName } = kube;

  const container = await DockerContainer.find({ imageName, dev });
  const running = container?.started;

  if (running) {
    if (!hot) {
      throw new Error('Unable to upgrade KUBE while it\'s running.');
    }
    await container.stop();
  }

  const dockerImage = new DockerImage({ service: kube, auth, dev });
  await dockerImage.pull(true);

  await DockerImage.cleanNotLatest(imageName);

  if (running) {
    const newContainer = await dockerImage.getOrCreateContainer({ name, restore: true });
    await newContainer.start();
  }
};
