//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawn } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import get from 'lodash.get';
import pify from 'pify';
import pm2, { Proc } from 'pm2';
import kill from 'tree-kill';

import { sleep } from '@dxos/async';

export interface RunnableConfig {
  env: any
  name: string
  flushLogs?: boolean
  singleInstance?: boolean
  autorestart?: boolean
  interpreter?: string
  maxMemory?: string
  watch?: boolean
  background?: boolean
  logFile?: string
  startTimeout?: number
}

const PROCESS_PREFIX = 'dxos.';
const STATUS_RUNNING = 'online';

// TODO(yivlad): Figure out how to properly handle memory limit.
const MAX_MEMORY = '2G';

const pm = {
  connect: pify(pm2.connect.bind(pm2)),
  disconnect: pify(pm2.disconnect.bind(pm2)),
  list: pify(pm2.list.bind(pm2)),
  start: pify(pm2.start.bind(pm2)),
  stop: pify(pm2.stop.bind(pm2)),
  restart: pify(pm2.restart.bind(pm2)),
  flush: pify(pm2.flush.bind(pm2)),
  describe: pify(pm2.describe.bind(pm2)),
  dump: pify(pm2.dump.bind(pm2))
};

const withPM2 = (func: Function, dump = false) => {
  return async (...args: any) => {
    let result;
    try {
      await pm.connect();
      result = await func(...args);
      if (dump) {
        await pm.dump();
      }
    } finally {
      await pm.disconnect();
    }
    return result;
  };
};

const _flushLogs = async (name: string) => {
  const procName = PROCESS_PREFIX + name;
  const descriptors = await pm.describe(procName);
  const logFile = get(descriptors, '[0].pm2_env.pm_out_log_path');

  if (logFile && existsSync(logFile)) {
    unlinkSync(logFile);
  }
};

const _listServices = async (usage = true) => {
  let processes: Array<Proc> = await pm.list();
  processes = processes.filter(proc => proc.name!.startsWith(PROCESS_PREFIX));

  let services = [];
  services = processes.map(proc => ({
    name: get(proc, 'name', '').replace(PROCESS_PREFIX, ''),
    exec: get(proc, 'pm2_env.pm_exec_path'),
    status: get(proc, 'pm2_env.status'),
    cpu: usage ? get(proc, 'monit.cpu') : 0,
    memory: usage ? get(proc, 'monit.memory') : 0
  }));

  return { services, processes };
};

const _stopService = async (name: string) => pm.stop(PROCESS_PREFIX + name);

const _restartService = async (name: string, options: any = {}) => {
  const { flushLogs = true } = options;
  const procName = PROCESS_PREFIX + name;
  if (flushLogs) {
    await pm.stop(procName);
    await _flushLogs(name);
  }
  await pm.restart(procName);
};

const _getLogs = async (name: string, options: any = {}) => {
  const { lines = 20, runningOnly, follow } = options;
  const procName = PROCESS_PREFIX + name;

  let { logFile } = options;
  if (!logFile) {
    const descriptors = await pm.describe(procName);
    const process = get(descriptors, '[0]');
    assert(process, 'Unable to find process');
    if (runningOnly && get(process, 'pm2_env.status') !== STATUS_RUNNING) {
      throw new Error('Process not running');
    }

    logFile = get(process, 'pm2_env.pm_out_log_path');
  }
  assert(logFile, 'Unable to locate log file.');

  const command = 'tail';
  const args = [`-${lines}`];
  if (follow) {
    args.push('-f');
  }
  args.push(logFile);

  spawn(command, args, { stdio: 'inherit' });
};

// TODO(burdon): Wrap class.
export const listServices = withPM2(_listServices);
export const stopService = withPM2(_stopService, true);
export const restartService = withPM2(_restartService, true);
export const getLogs = withPM2(_getLogs);
export const flushLogs = withPM2(_flushLogs);

export const sanitizeEnv = (env: any) => {
  const sanitizedEnv = Object.keys(env)
    .filter(key => key.startsWith('npm_') || !/[a-z]/.test(key))
    .reduce((obj: any, key: string) => {
      obj[key] = env[key];
      return obj;
    }, {});

  return sanitizedEnv;
};

/**
 * Wrapper for executable.
 */
export class Runnable {
  _executable: string;
  _args: Array<any>;
  /**
   * @constructor
   * @param {String} executable
   * @param {Array} args
   * @param {Object} options
   */
  constructor (executable: string, args: Array<any> = []) {
    assert(executable);
    assert(args);

    this._executable = executable;
    this._args = args;
  }

  /**
   * Start new process.
   * @param {Array} args
   * @param {Object} options
   */
  async run (args: Array<any> = [], options: any = {}) {
    const { detached } = options;
    if (detached) {
      await this._runDaemon(args, options);
    } else {
      await this._run(args, options);
    }
  }

  async _runDaemon (args: Array<any>, options: RunnableConfig) {
    const {
      env,
      name,
      flushLogs = true,
      singleInstance,
      autorestart = true,
      interpreter = 'none',
      maxMemory = MAX_MEMORY,
      watch = false,
      startTimeout
      // cwd
    } = options;

    assert(name);

    const { logFile = `/var/log/${name}.log` } = options;

    try {
      await pm.connect();

      const procName = PROCESS_PREFIX + name;
      if (singleInstance) {
        const processes = await pm.list();
        const running = get(processes.find((proc: Proc) => proc.name === procName), 'pm2_env.status') === 'online';
        if (running) {
          throw new Error('Process already running.');
        }
      }

      if (flushLogs) {
        await _flushLogs(name);
      }

      await pm.start({
        script: this._executable,
        args: [...this._args, ...args],
        output: logFile,
        error: logFile,
        watch,
        name: procName,
        interpreter,
        autorestart,
        max_memory_restart: maxMemory,
        env,
        logDateFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
      });
      startTimeout && await sleep(startTimeout);

      await pm.dump();
    } finally {
      await pm.disconnect();
    }
  }

  async _run (args: Array<any>, options: RunnableConfig) {
    return new Promise<void>(resolve => {
      const { background } = options;
      const child = spawn(this._executable, [...this._args, ...args], { ...options, stdio: 'inherit' });

      if (background) {
        resolve();
      }

      child.on('exit', () => {
        resolve();
      });

      child.on('SIGINT', () => {
        if (child.pid) {
          kill(child.pid);
        }

        process.exit();
      });
    });
  }
}
