//
// Copyright 2020 DXOS.org
//

import { DockerImage, asyncHandler, getImageInfo } from '@dxos/cli-core';

import image from '../../image.yml';

// import { log } from '@dxos/debug';

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
          // log(container);
        })
      })
  });
};
