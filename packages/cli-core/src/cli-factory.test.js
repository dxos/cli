//
// Copyright 2020 DXOS.org
//

import fs from 'fs';
import readline from 'readline';
import EventEmitter from 'events';

import { createCLI } from './cli-factory';
import { asyncHandler } from './util/async';

const WIRE_CLI_BASE_COMMAND = 'wire';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const testProfile = 'test';
const testError = 'unexpected error.';

jest.mock('./config', () => {
  const conf = jest.requireActual('./config');
  const { Config } = require('@dxos/config');
  return {
    ...conf,
    getConfig: () => new Config({})
  };
});

jest.spyOn(console, 'log').mockImplementation(() => {});

const mockMethod = jest.fn();
const interactiveMockMethod = jest.fn();

process.env.WIRE_PROFILE = 'test';

const TestModule = () => {
  return ({
    command: ['test'],
    describe: 'Test CLI.',
    builder: yargs => yargs
      .command({
        command: ['empty-command'],
        describe: 'Test command.',
        builder: yargs => yargs
          .option('test-argument', { type: 'string' }),

        handler: asyncHandler(async () => {})
      })
      .command({
        command: ['test-command'],
        describe: 'Test command.',
        builder: yargs => yargs
          .option('test-argument', { type: 'string' }),

        handler: asyncHandler(async argv => {
          mockMethod(argv);
        })
      })

      .command({
        command: ['test-interactive-command'],
        describe: 'Interactive command.',
        builder: yargs => yargs
          .option('interactive', { hidden: true, default: true }),

        handler: asyncHandler(async argv => {
          interactiveMockMethod();
        })
      })

      .command({
        command: ['fail-command'],
        describe: 'Interactive command with error.',
        builder: yargs => yargs
          .option('interactive', { hidden: true, default: true }),

        handler: asyncHandler(async argv => {
          throw new Error(testError);
        })
      })
  });
};

const extName = 'dxos/cli-test';
const extCommand = 'test';

const info = `
  name: ${extName}
  version: 0.0.1
  displayName: cli-test
  description: TEST CLI.
  command:
    - ${extCommand}
`;

let cli;

const initMock = jest.fn();
const destroyMock = jest.fn();

const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

beforeEach(() => {
  cli = createCLI(
    {
      options: WIRE_CONFIG,
      modules: [TestModule],
      dir: __dirname,
      main: false,
      info,
      init: initMock,
      destroy: destroyMock
    }
  );
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

    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(path => !path.endsWith(`${testProfile}.yml`));

    await cli.run();

    expect(exitSpy).toHaveBeenCalledTimes(1);

    existsSpy.mockReset();
  });
});

describe('cli-factory', () => {
  let existsSpy;

  beforeAll(() => {
    existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(path => true);
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

    const rl = new EventEmitter();
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
