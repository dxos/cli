//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import childProcess from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(childProcess.exec);

type execOptions = {
  retryCount?: number
};

export const exec = async (command: string, options?: execOptions): Promise<string | undefined> => {
  assert(command, 'Command should not be empty.');

  const { retryCount = 1 } = options ?? {};

  let result;
  for (let i = 1; i <= retryCount; i++) {
    try {
      result = await execAsync(command);
      const { stderr } = result;
      if (stderr) {
        throw new Error(stderr);
      }
      break;
    } catch (err) {
      if (i === retryCount) {
        throw err;
      }
    }
  }

  return result?.stdout;
};
