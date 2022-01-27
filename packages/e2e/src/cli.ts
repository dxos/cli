//
// Copyright 2021 DXOS.org
//

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { join } from 'path';

import { Event } from '@dxos/async';

const EXECUTABLE_PATH = join(__dirname, '../../cli/bin/dx.js');

const GLOBAL_DEBUG = process.env.CI !== undefined || process.env.E2E_DEBUG;
const DEBUG = 'dxos:cli';

export function cmd (command: string, cwd?: string): Command {
  return new Command(command, cwd);
}

export class Command {
  public readonly interactiveOutput = new Event<string>();

  private _debug = GLOBAL_DEBUG;
  private readonly _interactiveCommands: string[] = [];
  private _interactiveMode = false;

  private _stdout = Buffer.alloc(0)
  private _stderr = Buffer.alloc(0)

  constructor (private readonly _command: string, private readonly _cwd?: string) {}

  debug (): this {
    this._debug = true;
    return this;
  }

  addInteractiveCommand (command: string): Command {
    this._interactiveCommands.push(command);

    return this;
  }

  private async _execute (): Promise<ChildProcessWithoutNullStreams> {
    if (this._debug) {
      console.log(`[E2E] Running "dx ${this._command}":\n\n`);
    }

    const cp = spawn(`${EXECUTABLE_PATH} ${this._command}`, {
      shell: true,
      stdio: 'pipe',
      cwd: this._cwd || process.cwd(),
      env: {
        ...process.env,
        DEBUG
      }
    });

    let sentSIGINT = false;

    cp.stdout.on('data', chunk => {
      this._stdout = Buffer.concat([this._stdout, chunk]);

      if (this._debug) {
        process.stdout.write(chunk);
      }
      if (chunk.toString() === '[dx]> ') {
        this._interactiveMode = true;
        if (this._interactiveCommands.length > 0) {
          const interactiveCommand = this._interactiveCommands.shift();
          cp.stdin.write(`${interactiveCommand}\n`);
          process.stdout.write(`${interactiveCommand}\n`);
        } else {
          cp.kill('SIGINT');
          cp.kill('SIGINT');
          sentSIGINT = true;
        }
      } else if (this._interactiveMode) {
        this.interactiveOutput.emit(chunk.toString());
      }
    });

    cp.stderr.on('data', chunk => {
      this._stderr = Buffer.concat([this._stderr, chunk]);

      if (this._debug) {
        process.stderr.write(chunk);
      }
    });

    await new Promise<void>((resolve) => {
      cp.on('close', () => {
        resolve();
      });
    });

    if (this._debug) {
      console.log(`\n\n[E2E] Command exited with exit-code: ${cp.exitCode}, signal: ${cp.signalCode}.\n`);
    }

    if (cp.signalCode !== 'SIGINT' || !sentSIGINT) {
      if (cp.exitCode !== 0) {
        throw new Error(`Command "dx ${this._command}" exited with code ${cp.exitCode}`);
      } else if (cp.exitCode === null) {
        throw new Error(`Command "dx ${this._command}" exited with signal ${cp.signalCode}`);
      }
    }

    return cp;
  }

  async run (): Promise<void> {
    await this._execute();
  }

  async json<T = any> (): Promise<T> {
    await this._execute();

    return JSON.parse(this._stdout.toString());
  }
}
