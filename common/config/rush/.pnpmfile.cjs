'use strict';

const fs = require('fs')
const { join } = require('path');

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.  (This feature is
 * functionally similar to Yarn's "resolutions".)
 *
 * For details, see the PNPM documentation:
 * https://pnpm.js.org/docs/en/hooks.html
 *
 * IMPORTANT: SINCE THIS FILE CONTAINS EXECUTABLE CODE, MODIFYING IT IS LIKELY TO INVALIDATE
 * ANY CACHED DEPENDENCY ANALYSIS.  After any modification to pnpmfile.js, it's recommended to run
 * "rush update --full" so that PNPM will recalculate all version selections.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

let tarballsPath = undefined;
if (process.env.LINKED_PATH) {
  const dir = fs.readdirSync(join(process.env.LINKED_PATH, 'common/temp/artifacts')).find(name => name.startsWith('local-'))
  tarballsPath = join(process.env.LINKED_PATH, 'common/temp/artifacts', dir);
}

/**
 * This hook is invoked during installation before a package's dependencies
 * are selected.
 * The `packageJson` parameter is the deserialized package.json
 * contents for the package that is about to be installed.
 * The `context` parameter provides a log() function.
 * The return value is the updated object.
 */
function readPackage(packageJson, context) {
  if (process.env.LINKED_PATH) {
    const { projects } = eval(`(${fs.readFileSync(join(process.env.LINKED_PATH, 'rush.json'))})`);

    function processDeps(deps) {
      for (const [name, version] of Object.entries(deps)) {
        const project = projects.find(p => p.packageName === name);
        if (!project) {
          continue;
        }

        // TODO(burdon): Tempoarily looks in a remote repo determined by LINKED_PATH.
        const pkgJson = require(join(process.env.LINKED_PATH, project.projectFolder, 'package.json'));

        deps[name] = join(tarballsPath, `${name.replace('/', '-').replace('@', '')}-${pkgJson.version}.tgz`);
      }
    }

    processDeps(packageJson.dependencies ?? {});
    processDeps(packageJson.devDependencies ?? {});
  }

  // // The karma types have a missing dependency on typings from the log4js package.
  // if (packageJson.name === '@types/karma') {
  //  context.log('Fixed up dependencies for @types/karma');
  //  packageJson.dependencies['log4js'] = '0.6.38';
  // }

  if(packageJson.name === 'eslint-plugin-unused-imports') {
    packageJson.peerDependencies['@typescript-eslint/eslint-plugin'] = '^4.14.2 || ^5.0.0'
  }

  return packageJson;
}
