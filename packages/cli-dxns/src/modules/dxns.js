//
// Copyright 2020 DXOS.org
//

import { asyncHandler, DockerImage } from '@dxos/cli-core';

// import { log } from '@dxos/debug';

export const DXNSModule = ({ config }) => ({
  command: ['dxns'],
  describe: 'DXNS operations.',
  builder: yargs => yargs

    .command({
      command: ['start'],
      describe: 'Start DXNS.',

      handler: asyncHandler(async () => {
        const image = new DockerImage({
          imageName: 'ghcr.io/alienlaboratories/substrate-node',
          args: ['node-template', '--dev', '--tmp', '--rpc-cors', 'all', '-lsync=warn', '-lconsole-debug', '--ws-external', '--rpc-external'],
          ports: { '9944/tcp': '9944' },
          auth: {
            username: 'alienlaboratories',
            password: config.get('services.machine.githubAccessToken'),
            auth: '',
            email: 'gripasovegor@gmail.com',
            serveraddress: 'https://ghcr.io'
          }
        });

        await image.createContainer();
        // log(container);
      })
    })
});
