//
// Copyright 2021 DXOS.org
//

import { DockerImage } from '@dxos/cli-core';

export const install = (config, { getAuth, kubeCompose }) => async ({ auth: authRequired, force, dev }) => {
  const { services: { kube } } = kubeCompose;

  const auth = authRequired ? getAuth(config, kube) : undefined;

  const dockerImage = new DockerImage({ service: kube, auth, dev });
  await dockerImage.pull(force);
};
