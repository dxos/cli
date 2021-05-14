//
// Copyright 2020 DXOS.org
//

import download from 'download';
import { pathExists, copy, remove, emptyDir } from 'fs-extra';
import os from 'os';
import path from 'path';
import URL from 'url';

const GITHUB_HOSTNAME = 'github.com';
const CONFIG = { timeout: 30000, extract: true, strip: 1, mode: '755' };

/**
 * Template Helper.
 */
export class TemplateHelper {
  /**
   * @param {Object} url
   * @returns {Object}
   */
  static parseGitHubURL (url) {
    const parts = url.pathname.split('/');
    const isSubdir = parts.length > 4;
    const owner = parts[1];
    const repo = parts[2];
    const branch = isSubdir ? parts[4] : 'main';

    // Validate if given url is a valid GitHub url.
    if (url.hostname !== 'github.com' || !owner || !repo) {
      throw new Error('The URL must be a valid GitHub URL.');
    }

    let pathToDir = '';
    for (let i = 5; i <= parts.length - 1; i++) {
      pathToDir = path.join(pathToDir, parts[i]);
    }

    const downloadUrl = ['https://github.com/', owner, '/', repo, '/archive/', branch, '.zip'].join('');

    return {
      owner,
      repo,
      branch,
      downloadUrl,
      isSubdir,
      pathToDir
    };
  }

  /**
   * Parse URL and call the appropriate adaptor.
   *
   * @param {string} inputUrl
   * @throws {Error}
   * @returns {Object}
   */
  static parseURL (inputUrl) {
    console.assert(inputUrl, 'URL is required');

    // eslint-disable-next-line
    const url = URL.parse(inputUrl.replace(/\/$/, ''));

    if (!url.host) {
      throw new Error('The URL you passed is not valid');
    }

    switch (url.hostname) {
      case GITHUB_HOSTNAME: {
        return TemplateHelper.parseGitHubURL(url);
      }
      default: {
        throw new Error('The URL you passed is not one of the valid providers.');
      }
    }
  }

  /**
   * Downloads template from repo.
   * @param {string} inputUrl
   * @param {string} [downloadPath]
   * @param {string} githubToken
   * @param {boolean} force
   * @returns {Promise}
   */
  static async downloadTemplateFromRepo (inputUrl, githubToken, downloadPath, force) {
    const repoInfo = TemplateHelper.parseURL(inputUrl);

    // If template is in a subdirectory of a repo, use directory name as default build directory.
    if (repoInfo.pathToDir && repoInfo.isSubdir) {
      const basePath = path.basename(repoInfo.pathToDir);
      downloadPath || (downloadPath = `./${basePath}`); // if no path is specified, use the ./{basePath}
    } else {
      downloadPath || (downloadPath = `./${repoInfo.repo}`); // if no path is specified, use the ./{repo-name}
    }

    let downloadPackagePath;

    if (repoInfo.isSubdir) {
      downloadPackagePath = path.join(os.tmpdir(), repoInfo.repo);
    } else if (path.isAbsolute(downloadPath)) {
      downloadPackagePath = downloadPath;
    } else {
      downloadPackagePath = path.join(process.cwd(), downloadPath);
    }

    let packagePath;

    if (path.isAbsolute(downloadPath)) {
      packagePath = downloadPath;
    } else {
      packagePath = path.join(process.cwd(), downloadPath);
    }

    if ((await pathExists(packagePath)) && path.resolve(process.cwd(), downloadPath) !== process.cwd()) {
      if (!force) {
        throw new Error('Folder already exists!');
      } else {
        await emptyDir(packagePath);
      }
    }

    await download(
      repoInfo.downloadUrl,
      downloadPackagePath,
      githubToken ? { headers: { Authorization: `token ${githubToken}` }, ...CONFIG } : CONFIG
    );

    if (repoInfo.isSubdir) {
      const directory = path.join(downloadPackagePath, repoInfo.pathToDir);
      await copy(directory, packagePath);
      await remove(downloadPackagePath);
    }

    return packagePath;
  }
}
