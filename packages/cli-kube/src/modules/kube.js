//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { asyncHandler, loadYml } from '@dxos/cli-core';

import {
  assemble, del, deploy, get, importCertificate, install, list, ping, register, setupOTP, start, status, stop, upgrade
} from '../handlers';

const services = loadYml(path.join(__dirname, '../../services.yml'));
const docker = loadYml(path.join(__dirname, '../../docker-compose.yml'));

const DEFAULT_FQDN = 'kube.local';

const getAuth = (config, imageInfo) => ({
  username: config.get('runtime.services.machine.githubUsername'),
  password: config.get('runtime.services.machine.githubAccessToken'),
  serveraddress: `https://${imageInfo.image.split('/')[0]}`
});

export const KubeModule = ({ config, getDXNSClient }) => ({
  command: ['kube'],
  describe: 'KUBE management.',
  builder: yargs => yargs
    .option('account', { type: 'string', array: false, describe: 'Optionally override DXNS Account from config.' })

    .command({
      command: ['install'],
      describe: 'Install KUBE.',
      builder: yargs => yargs
        .option('force', { type: 'boolean', default: false, description: 'Force install' })
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' }),
      handler: asyncHandler(install(config, { getAuth, kubeCompose: docker }))
    })

    .command({
      command: ['upgrade'],
      describe: 'Upgrade KUBE.',
      builder: yargs => yargs
        .option('auth', { type: 'boolean', default: false, description: 'Authentication required' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' })
        .option('hot', { type: 'boolean', default: false, description: 'Hot upgrade' })
        .option('name', { type: 'string', description: 'Container name' }),
      handler: asyncHandler(upgrade(config, { getAuth, kubeCompose: docker }))
    })

    .command({
      command: ['start'],
      describe: 'Run KUBE.',
      builder: yargs => yargs
        .option('key-phrase', { type: 'string', description: 'KUBE OTP keyphrase.' })
        .option('services', { describe: 'Services to run.', type: 'string', default: JSON.stringify(services) })
        .option('services-override', { describe: 'Additional services config.', type: 'string', default: JSON.stringify([]) })
        .option('name', { type: 'string', description: 'Container name' })
        .option('fqdn', { type: 'string', description: 'Fully Qualified Domain Name.', default: DEFAULT_FQDN })
        .option('letsencrypt', { type: 'boolean', default: false })
        .option('email', { type: 'string' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' }),
      handler: asyncHandler(start({ kubeCompose: docker }))
    })

    .command({
      command: ['stop'],
      describe: 'Stop KUBE.',
      builder: yargs => yargs
        .option('cleanup', { type: 'boolean', description: 'Remove containers.', default: false }),
      handler: asyncHandler(stop())
    })

    .command({
      command: ['deploy'],
      describe: 'Deploy KUBE to supported Cloud Provider.',
      builder: yargs => yargs
        .option('name', { type: 'string' })
        .option('memory', { type: 'number' })
        .option('region', { type: 'string' })
        .option('pin', { type: 'boolean', default: false })
        .option('register', { type: 'boolean', default: false })
        .option('letsencrypt', { type: 'boolean', default: false })
        .option('email', { type: 'string' })
        .option('key-phrase', { type: 'string' })
        .option('services', { describe: 'Services to run.', type: 'string', default: JSON.stringify(services) })
        .option('services-override', { describe: 'Additional services config.', type: 'string', default: JSON.stringify([]) })
        .option('ssh-keys', { type: 'array' })
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' }),
      handler: asyncHandler(deploy(config))
    })

    .command({
      command: ['get'],
      describe: 'Get deployed KUBEs info.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),
      handler: asyncHandler(get(config))
    })

    .command({
      command: ['list'],
      describe: 'List deployed KUBEs.',
      handler: asyncHandler(list(config))
    })

    .command({
      command: ['delete'],
      describe: 'Delete deployed KUBEs.',
      builder: yargs => yargs
        .option('name', { type: 'string' }),
      handler: asyncHandler(del(config))
    })

    .command({
      command: ['assemble'],
      describe: 'Install CLI extensions and Services required for running KUBE.',
      builder: yargs => yargs.version(false)
        .option('dev', { type: 'boolean', default: false, description: 'Dev build' }),
      handler: asyncHandler(assemble())
    })

    .command({
      command: ['register'],
      describe: 'Register KUBE.',
      builder: yargs => yargs
        .option('name', { required: true, type: 'string' })
        .option('domain', { required: true, type: 'string' })
        .option('url', { required: true, type: 'string' }),
      handler: asyncHandler(register({ getDXNSClient }))
    })

    .command({
      command: ['otp'],
      describe: 'Setup KUBE OTP.',
      builder: yargs => yargs
        .option('key-phrase', { type: 'string' }),
      handler: asyncHandler(setupOTP())
    })

    .command({
      command: ['cert'],
      describe: 'Certificate management.',
      handler: () => {},
      builder: yargs => yargs
        .command({
          command: ['import'],
          describe: 'Import certificate.',
          builder: yargs => yargs
            .option('url', { default: config.get('runtime.services.kube.endpoints.cert') }),
          handler: asyncHandler(importCertificate())
        })
    })

    .command({
      command: ['local'],
      describe: 'Local KUBE management.',
      handler: () => {},
      builder: yargs => yargs
        .command({
          command: ['ping'],
          describe: 'Ping.',
          handler: asyncHandler(ping())
        })
        .command({
          command: ['status'],
          describe: 'Get status.',
          handler: asyncHandler(status())
        })
    })
});
