//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import get from 'lodash.get';
import omit from 'lodash.omit';
import readline from 'readline';
import { Arguments } from 'yargs';
import unparse from 'yargs-unparser';
import yargs from 'yargs/yargs';

import { CoreOptions, coreOptions, FORWARD_OPTION } from './options';
import { CoreState } from './types';
import { getLoggers } from './utils';

const VERSION_COMMAND = 'version';

const { log, logError } = getLoggers();

// http://patorjk.com/software/taag/#p=testall&f=Patorjk-HeX&t=DXOS
const BANNER = '\n' +
  '______________/\\/\\/\\/\\/\\____/\\/\\____/\\/\\____/\\/\\/\\/\\______/\\/\\/\\/\\______________\n' +
  '______________/\\/\\____/\\/\\____/\\/\\/\\/\\____/\\/\\____/\\/\\__/\\/\\____________________\n' +
  '______________/\\/\\____/\\/\\______/\\/\\______/\\/\\____/\\/\\____/\\/\\/\\________________\n' +
  '______________/\\/\\____/\\/\\____/\\/\\/\\/\\____/\\/\\____/\\/\\________/\\/\\______________\n' +
  '______________/\\/\\/\\/\\/\\____/\\/\\____/\\/\\____/\\/\\/\\/\\____/\\/\\/\\/\\________________\n\n' +
  '                           DXOS Command Line Interface \n\n';

export interface ConstructorConfig extends Omit<CoreState, 'cliState'> {
  state?: CoreState
  version?: string
}

/**
 * CLI app.
 */
// TODO(burdon): Rename Main?
export class App {
  _version: string;
  _prompt: string;
  _baseCommand: string;
  _enableInteractive: boolean;
  _state: CoreState;
  _config: any;
  _getModules: any;
  _args: any;
  _rl: any;

  /**
   * Yargs parser.
   */
  _parser = coreOptions(yargs())
    // http://yargs.js.org/docs/#api-help
    .help(true)

    // http://yargs.js.org/docs/#api-reference-version
    .version(false)

    // https://yargs.js.org/docs/#api-reference-parserconfigurationobj
    .parserConfiguration({
      'sort-commands': true,
      'parse-numbers': false
    })

    // http://yargs.js.org/docs/#api-exitprocessenable
    .exitProcess(false)

    // http://yargs.js.org/docs/#api-strictenabledtrue
    .strict(true)

    // http://yargs.js.org/docs/#api-failfn
    .fail(msg => {
      throw new Error(msg);
    });

  _modules: Array<Function> = [];

  constructor (constructorConfig: ConstructorConfig) {
    const { config: cliConfig, state, options, version, profilePath, profileExists } = constructorConfig;
    const { prompt, baseCommand, enableInteractive = false } = options ?? {};

    this._version = version ?? '';
    this._prompt = prompt;
    this._baseCommand = baseCommand;
    this._enableInteractive = enableInteractive;

    if (state) {
      this._state = state;
      this._config = state.config;
    } else {
      this._config = cliConfig;
      this._state = {
        config: cliConfig,
        getReadlineInterface: this.getReadlineInterface.bind(this),
        cliState: {
          interactive: false
        },
        models: [],
        profilePath,
        profileExists
      };
    }

    // Register modules.
    const { modules, getModules } = constructorConfig;
    this._modules = modules ?? [];
    this._getModules = getModules;
  }

  get state () {
    return this._state;
  }

  /**
   * Yargs does not support async functions, so we wrap the call with a promise.
   *
   * TODO(burdon): Async commands?
   * https://github.com/yargs/yargs/issues/918
   * https://github.com/yargs/yargs/issues/510
   *
   * @param input - input string.
   * @param interactive - true if in interactive mode.
   */
  async parseAsync (input: string, interactive = false): Promise<any> {
    assert(this._parser, 'Invalid command parser.');

    return new Promise((resolve, reject) => {
      const context = {};

      if (!interactive) {
        this._parser.usage(BANNER + '$0 [command]');
      }

      // http://yargs.js.org/docs/#api-parseargs-context-parsecallback
      void this._parser
        // Bug: yargs resets help settings after first usage of external CLI, so need to set it again.
        .help(true)

        // eslint-disable-next-line
        .parse(input, context, async (err, argv, output) => {
          // Strip command name if in CLI mode.
          // TODO(burdon): https://github.com/yargs/yargs/issues/1010
          if (interactive) {
            const command = argv.$0.split('/').pop();
            output = output.replace(new RegExp(`${command} `, 'gi'), '');
          }

          // Wait for potentially async result.
          try {
            const result = await Promise.resolve(argv._result);
            resolve({
              command: argv.help ? 'help' : argv._.pop(),
              output: result || output,
              argv
            });
          } catch (err) {
            reject(err);
          }
        });
    });
  }

  /**
   * Process the command.
   */
  async start (argv?: Arguments<CoreOptions>) {
    try {
      // Init modules.
      if (this._getModules) {
        this._modules = await this._getModules();
      }

      for (const module of this._modules) {
        this._parser.command(module(this.state));
      }

      this._args = argv ? unparse(omit(argv, ['_result'])) : process.argv.slice(2);

      // No-op.
      if ((argv && this._args[1] === VERSION_COMMAND) || (!argv && this._args[0] === VERSION_COMMAND)) {
        log(this._version);
        return;
      }

      // Transform args to forward into format that can be parsed by yargs.
      // E.g. `dx signal start -- --foo bar` would be transformed into `dx signal start --forward "{ args: ['--foo', 'bar']}"`
      const forwardIndex = this._args.findIndex((arg: any) => arg === '--');
      if (forwardIndex !== -1) {
        const forwardArgs = JSON.stringify({ args: this._args.slice(forwardIndex + 1) });
        this._args = [...this._args.slice(0, forwardIndex), `--${FORWARD_OPTION}`, forwardArgs];
      }

      let interactive;
      let poll;

      // Parse and execute the command.
      const exec = async () => {
        // Issue: yargs removes quotes.
        // https://github.com/yargs/yargs-parser/issues/180
        const result: any = await this.parseAsync(
          this._args.map((arg: any) => String(arg).replace(/^{/g, '\'{').replace(/={/g, '=\'{').replace(/}$/g, '}\'')).join(' ')
        );
        const { output } = result;

        interactive = get(result, 'argv.interactive') || get(output, 'argv.interactive');
        poll = get(result, 'argv.poll') || get(output, 'argv.poll');

        if (output && !output.argv) {
          log(output.toString());
        }

        return result;
      };

      const result: any = await exec();
      if (this._enableInteractive && interactive && !argv && result.command !== 'help') {
        return this.startInteractive();
      }

      if (poll) {
        // Poll command.
        const delay = poll === true ? 5000 : Number(poll);
        return new Promise(() => {
          setInterval(async () => {
            await exec();
          }, delay);
        });
      }
      return result;
    } catch (err) {
      logError(err);
      if (!this._state.cliState.interactive) {
        process.exit(1);
      }
    }
  }

  /**
   * Start interactive mode.
   */
  async startInteractive () {
    this._state.cliState.interactive = true;

    this.getReadlineInterface();

    // Wait until the readline stream is closed.
    return new Promise<void>((resolve) => {
      this._rl.prompt();
      this._rl.on('line', async (input: string) => {
        try {
          // Merge command line args.
          const command = [this._baseCommand, input].join(' ');

          // Run command.
          const { output } = await this.parseAsync(command, true);
          if (output && !output.argv) {
            log(output.toString());
          }

          this._rl.prompt();
        } catch (err) {
          logError(err);
          this._rl.prompt();
        }
      }).on('close', () => {
        resolve();
      });
    });
  }

  getReadlineInterface () {
    if (!this._rl) {
      this._rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `[${this._prompt}]> `
      });
    }

    return this._rl;
  }
}
