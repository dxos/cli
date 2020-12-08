//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import readline from 'readline';
import unparse from 'yargs-unparser';
import yargs from 'yargs/yargs';
import get from 'lodash.get';
import omit from 'lodash.omit';

import { getLoggers } from './util/log';

const FORWARD_OPTION = 'forward';
const VERSION_COMMAND = 'version';

const { log, logError } = getLoggers();

/**
 * CLI app.
 */
export class App {
  /**
   * Yargs parser.
   * @type {Object}
   */
  _parser = yargs()
    .option({
      verbose: {
        description: 'Verbose output',
        demand: false,
        default: false,
        type: 'boolean',
        alias: 'v'
      }
    })
    .option({
      json: {
        description: 'JSON output',
        demand: false,
        default: false,
        type: 'boolean'
      }
    })
    .option('dry-run', {
      description: 'Dry run',
      demand: false,
      default: false,
      type: 'boolean'
    })
    .option('profile', {
      description: 'Profile',
      demand: false
    })
    .option(FORWARD_OPTION, {
      type: 'json'
    })
    // Required for extensions.
    .option('mnemonic', {
      type: 'array'
    })

    // http://yargs.js.org/docs/#api-help
    .help()

    .version(false)

    // http://yargs.js.org/docs/#api-exitprocessenable
    .exitProcess(false)

    // http://yargs.js.org/docs/#api-strictenabledtrue
    .strict(true)

    // http://yargs.js.org/docs/#api-failfn
    .fail(msg => {
      logError(msg);
      process.exit(1);
    });

  _modules = [];

  /**
   * @constructor
   * @param {Object} config
   */
  constructor (config = {}) {
    const { config: cliConfig, state, options, version } = config;
    const { prompt, baseCommand, enableInteractive = false } = options;

    this._version = version;
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
        models: []
      };
    }

    // Register modules.
    const { modules, getModules } = config;
    this._modules = modules;
    this._getModules = getModules;
  }

  get state () {
    return this._state;
  }

  /**
   * yargs does not support async functions, so we wrap the call with a promise.
   *
   * TODO(burdon): Async commands?
   * https://github.com/yargs/yargs/issues/918
   * https://github.com/yargs/yargs/issues/510
   *
   * @param input - input string.
   * @param interactive - true if in interactive mode.
   */
  async parseAsync (input, interactive) {
    assert(this._parser, 'Invalid command parser.');

    return new Promise((resolve, reject) => {
      const context = {};

      // http://yargs.js.org/docs/#api-parseargs-context-parsecallback
      this._parser
        // Bug: yargs resets help settings after first usage of external CLI,
        // so need to set it again.
        .help()
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
  async start (argv) {
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

      const forwardIndex = this._args.findIndex(arg => arg === '--');
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
        const result = await this.parseAsync(
          this._args.map(a => String(a).replace(/^{/g, '\'{').replace(/={/g, '=\'{').replace(/}$/g, '}\'')).join(' ')
        );
        const { output } = result;

        interactive = get(result, 'argv.interactive') || get(output, 'argv.interactive');
        poll = get(result, 'argv.poll') || get(output, 'argv.poll');

        if (!interactive && output && !output.argv) {
          log(output.toString());
        }

        return result;
      };

      const result = await exec();

      if (this._enableInteractive && interactive && !argv) {
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
    return new Promise((resolve) => {
      this._rl.prompt();
      this._rl.on('line', async input => {
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
