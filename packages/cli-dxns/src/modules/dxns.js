//
// Copyright 2020 DXOS.org
//

import { DockerImage, DockerContainer, asyncHandler, getImageInfo } from '@dxos/cli-core';

import image from '../../image.yml';

export const DXNSModule = ({ config }) => {
  const imageInfo = getImageInfo(image);

  const auth = {
    username: config.get('services.machine.githubUsername'),
    password: config.get('services.machine.githubAccessToken'),
    serveraddress: `https://${imageInfo.imageName.split('/')[0]}`
  };

  return ({
    command: ['dxns'],
    describe: 'DXNS operations.',
    builder: yargs => yargs

      .command({
        command: ['install', 'update'],
        describe: 'Start DXNS.',

        builder: yargs => yargs
          .option('force', { type: 'boolean', default: false, description: 'Force install / update' }),

        handler: asyncHandler(async argv => {
          const { force } = argv;

          const dockerImage = new DockerImage({ ...imageInfo, auth });

          await dockerImage.pull(force);
        })
      })

      .command({
        command: ['start'],
        describe: 'Start DXNS.',

        handler: asyncHandler(async () => {
          const dockerImage = new DockerImage(imageInfo);

          await dockerImage.createContainer();
        })
      })

      .command({
        command: ['logs'],
        describe: 'DXNS logs.',

        builder: yargs => yargs
          .option('follow', { type: 'boolean', default: false, description: 'Follow logs' })
          .option('tail', { type: 'number', default: 100, description: 'Number of lines' }),

        handler: asyncHandler(async argv => {
          const { tail, follow } = argv;

          const container = await DockerContainer.find(imageInfo.imageName);
          await container.logs(tail, follow);
        })
      })
  });
};
