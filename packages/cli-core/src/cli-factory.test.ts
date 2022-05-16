//
// Copyright 2020 DXOS.org
//

import EventEmitter from 'events';
import fs from 'fs';
import readline from 'readline';
import { Argv } from 'yargs';

import { createCLI } from './cli-factory';
import { Extension } from './types';
import { asyncHandler } from './utils';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const testProfile = 'test';
const testError = 'unexpected error.';

jest.mock('./config', () => {
  const conf = jest.requireActual('./config');
  // eslint-disable-next-line
  const { Config } = require('@dxos/config');
  return {
    ...conf,
    getConfig: () => new Config({})
  };
});

jest.spyOn(console, 'log').mockImplementation(() => {});

const mockMethod = jest.fn();
const interactiveMockMethod = jest.fn();

process.env.DX_PROFILE = 'test';

class MockRl extends EventEmitter {
  prompt: any;
  terminal: any;
  line: any;
  cursor: any;
  setPrompt: any;
  question: any;
  pause: any;
  resume: any;
  close: any;
  write: any;
  getCursorPos: any;
  getPrompt: any;
  [Symbol.asyncIterator]: any;
}

const TestModule = () => {
  return ({
    command: ['test'],
    describe: 'Test CLI.',
    builder: (yargs: Argv) => yargs
      .command({
        command: ['empty-command'],
        describe: 'Test command.',
        builder: (yargs: Argv) => yargs
          .option('test-argument', { type: 'string' }),

        handler: asyncHandler(async () => {})
      })
      .command({
        command: ['test-command'],
        describe: 'Test command.',
        builder: (yargs: Argv) => yargs
          .option('test-argument', { type: 'string' }),

        handler: asyncHandler(async (argv: Argv) => {
          mockMethod(argv);
        })
      })

      .command({
        command: ['test-interactive-command'],
        describe: 'Interactive command.',
        builder: (yargs: Argv) => yargs
          .option('interactive', { hidden: true, default: true }),

        handler: asyncHandler(async () => {
          interactiveMockMethod();
        })
      })

      .command({
        command: ['fail-command'],
        describe: 'Interactive command with error.',
        builder: (yargs: Argv) => yargs
          .option('interactive', { hidden: true, default: true }),

        handler: asyncHandler(async () => {
          throw new Error(testError);
        })
      })
  });
};

const info: Extension = {
  moduleName: '@dxos/cli-test',
  version: '1.0.0',
  displayName: 'cli-test',
  description: 'TEST CLI.',
  modules: [{
    command: 'test'
  }]
};

let cli: any;

const initMock = jest.fn();
const destroyMock = jest.fn();

const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

beforeEach(() => {
  cli = createCLI({
    dir: __dirname,
    main: false,
    modules: [TestModule],
    info,
    init: initMock,
    destroy: destroyMock,
    options: CLI_CONFIG
  });
});

describe('cli-factory - setup', () => {
  test('call init and destroy methods', async () => {
    process.argv = ['node', 'jest', 'test', 'empty-command'];

    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true);

    await cli.run();

    expect(initMock.mock.calls.length).toBe(1);
    expect(destroyMock.mock.calls.length).toBe(1);

    existsSpy.mockReset();
  });

  test('exit if no active profile', async () => {
    process.argv = ['node', 'jest', 'test', 'empty-command'];

    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(path => !path.toString().endsWith(`${testProfile}.yml`));

    await cli.run();

    expect(exitSpy).toHaveBeenCalledTimes(1);

    existsSpy.mockReset();
  });
});

describe('cli-factory', () => {
  let existsSpy: any;

  beforeAll(() => {
    existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
  });

  afterAll(() => {
    existsSpy.mockReset();
  });

  test('call test method', async () => {
    const testArg = 'test-argument';
    const testArgValue = 'test-argument-value';
    process.argv = ['node', 'jest', 'test', 'test-command', `--${testArg}`, testArgValue];

    await cli.run();
    expect(mockMethod.mock.calls.length).toBe(1);
    expect(mockMethod.mock.calls[0][0][testArg]).toEqual(testArgValue);
  });

  test('thrown error - graceful exit', async () => {
    process.argv = ['node', 'jest', 'test', 'fail-command'];

    const errPrintSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await cli.run();

    expect(errPrintSpy.mock.calls.length).toBe(1);
    expect(errPrintSpy.mock.calls[0][0]).toEqual(`\nError: ${testError}`);

    expect(exitSpy).toHaveBeenCalledTimes(2);

    errPrintSpy.mockReset();
  });

  test('call method that enables interactive mode', async () => {
    process.argv = ['node', 'jest', 'test', 'test-interactive-command'];

    const rl = new MockRl();
    rl.prompt = jest.fn();

    const rlSpy = jest.spyOn(readline, 'createInterface').mockImplementation(() => rl);

    setTimeout(() => {
      rl.emit('close');
    }, 200);

    await cli.run();

    expect(interactiveMockMethod.mock.calls.length).toBe(1);
    expect(rl.prompt.mock.calls.length).toBe(1);

    rlSpy.mockClear();
  });
});
