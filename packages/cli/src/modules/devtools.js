//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import download from 'download';
import { Octokit } from 'octokit';
import path from 'path';
import urlJoin from 'url-join';

import { asyncHandler } from '@dxos/cli-core';

const OWNER = 'dxos';
const REPO = 'protocols';
const ARTIFACT_NAME = 'Devtools';

const CONFIG = { timeout: 30000, extract: false, strip: 1, mode: '755' };

/**
 * Cert CLI module.
 * @returns {object}
 */
export const DevToolsModule = ({ config }) => ({
  command: ['devtools'],
  describe: 'Development tools.',

  builder: yargs => yargs
    .command({
      command: ['collect'],
      describe: 'Publish Development tools to IPFS.',
      builder: yargs => yargs
        .option('path', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { path: downloadPath = process.cwd() } = argv;

        const githubToken = config.get('runtime.services.machine.githubAccessToken');

        const octokit = new Octokit({ auth: githubToken });

        const res = await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts', {
          owner: OWNER,
          repo: REPO
        });

        const latestArtifact = res.data.artifacts.find(artifact => artifact.name === ARTIFACT_NAME);
        assert(latestArtifact, `Latest ${ARTIFACT_NAME} is not found.`);

        const downloadPackagePath = path.isAbsolute(downloadPath) ? downloadPath : path.join(process.cwd(), downloadPath);

        process.removeAllListeners('warning');
        await download(
          latestArtifact.archive_download_url,
          downloadPackagePath,
          githubToken ? { headers: { Authorization: `token ${githubToken}` }, ...CONFIG } : CONFIG
        );

        return path.join(downloadPackagePath, `${ARTIFACT_NAME}.zip`);
      })
    })

    .command({
      command: ['download'],
      describe: 'Download latest published Development tools.',
      builder: yargs => yargs
        .option('from', { type: 'string' })
        .option('path', { type: 'string' }),

      handler: asyncHandler(async argv => {
        const { from, path: downloadPath = process.cwd() } = argv;

        assert(from, 'Invalid IPFS CID.');

        const downloadPackagePath = path.isAbsolute(downloadPath) ? downloadPath : path.join(process.cwd(), downloadPath);

        process.removeAllListeners('warning');
        await download(
          urlJoin(config.get('runtime.services.ipfs.gateway'), from),
          downloadPackagePath,
          CONFIG
        );
      })
    })
});
