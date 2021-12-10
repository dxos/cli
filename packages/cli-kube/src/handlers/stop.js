//
// Copyright 2021 DXOS.org
//

import { RUNNING_STATE, DockerContainer } from '@dxos/cli-core';

export const stop = () => async ({ cleanup }) => {
  const containers = await DockerContainer.list();
  const runningContainers = containers.filter(container => container.state === RUNNING_STATE);

  await Promise.all(runningContainers.map(async container => {
    await container.stop();
    if (cleanup) {
      await container.destroy();
    }
  }));
};
