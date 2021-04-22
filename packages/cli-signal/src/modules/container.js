//
// Copyright 2020 DXOS.org
//

import { DockerImage, DockerContainer, asyncHandler, getImageInfo } from '@dxos/cli-core';

import image from '../../image.yml';

const DXNS_PROCESS_NAME = 'signal';
const SIGNAL_BIN = 'signal';

export const SignalContainerModule = ({ config }) => {
  const imageInfo = getImageInfo(image);

  const auth = {
    username: config.get('services.machine.githubUsername'),
    password: config.get('services.machine.githubAccessToken'),
    serveraddress: `https://${imageInfo.imageName.split('/')[0]}`
  };

  return ({
    command: ['container-signal'],
    describe: 'Signal operations.',
    builder: yargs => yargs

      .command({
        command: ['install'],
        describe: 'Install Signal.',

        builder: yargs => yargs
          .option('force', { type: 'boolean', default: false, description: 'Force install' }),

        handler: asyncHandler(async argv => {
          const { force } = argv;

          const dockerImage = new DockerImage({ ...imageInfo, auth });

          await dockerImage.pull(force);
        })
      })

      .command({
        command: ['upgrade'],
        describe: 'Upgrade Signal.',

        handler: asyncHandler(async () => {
          const { imageName } = imageInfo;

          const container = await DockerContainer.find({ imageName });
          if (container && container.started) {
            throw new Error('Unable to upgrade DXNS while it\'s running.');
          }

          // TODO(egorgripasov): Already up-to-date message.
          const dockerImage = new DockerImage({ ...imageInfo, auth });
          await dockerImage.pull(true);

          await DockerImage.cleanNotLatest(imageName);
        })
      })

      .command({
        command: ['start'],
        describe: 'Start Signal.',

        builder: yargs => yargs
          .strict(false)
          .option('name', { type: 'string', default: DXNS_PROCESS_NAME, description: 'Container name' }),

        handler: asyncHandler(async argv => {
          const { name } = argv;
          const dockerImage = new DockerImage(imageInfo);

          const args = Object.entries(argv).filter(([k, v]) => !k.includes('-') && Boolean(v)).reduce((prev, [key, value]) => {
            if (value !== false && !['$0', '_', 'name'].includes(key)) {
              return [...prev, ...[`--${key}`, value !== true ? value : undefined].filter(Boolean)];
            }
            return prev;
          }, []);

          args.unshift(SIGNAL_BIN);

          const container = await dockerImage.getOrCreateContainer(name, args);
          await container.start();
        })
      })

      .command({
        command: ['logs'],
        describe: 'Signal logs.',

        builder: yargs => yargs
          .option('name', { type: 'string', default: DXNS_PROCESS_NAME, description: 'Container name' })
          .option('follow', { type: 'boolean', default: false, description: 'Follow logs' })
          .option('tail', { type: 'number', default: 100, description: 'Number of lines' }),

        handler: asyncHandler(async argv => {
          const { tail, follow, name } = argv;
          const { imageName } = imageInfo;

          const container = await DockerContainer.find({ imageName, name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.logs(tail, follow);
        })
      })

      .command({
        command: ['stop'],
        describe: 'Stop Signal.',

        builder: yargs => yargs
          .option('name', { type: 'string', default: DXNS_PROCESS_NAME, description: 'Container name' }),

        handler: asyncHandler(async argv => {
          const { name } = argv;
          const { imageName } = imageInfo;

          const container = await DockerContainer.find({ imageName, name });
          if (!container) {
            throw new Error(`Unable to find "${name}" service.`);
          }
          await container.stop();
        })
      })
  });
};
