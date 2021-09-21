import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { join } from 'path';

const EXECUTABLE_PATH = join(__dirname, '../../cli/bin/dx.js')

const GLOBAL_DEBUG = process.env.CI !== undefined

export function cmd(command: string): Command {
  return new Command(command);
}

export class Command {
  private _debug = GLOBAL_DEBUG;

  private _stdout = Buffer.alloc(0)
  private _stderr = Buffer.alloc(0)

  constructor(private readonly _command: string) {}

  debug(): this {
    this._debug = true;
    return this;
  }

  private async _execute(): Promise<ChildProcessWithoutNullStreams> {
    if(this._debug) {
      console.log(`Running "${this._command}":\n\n`)
    }

    const cp = spawn(`${EXECUTABLE_PATH} ${this._command}`, { shell: true, stdio: 'pipe' })

    cp.stdout.on('data', chunk => {
      this._stdout = Buffer.concat([this._stdout, chunk])

      if(this._debug) {
        process.stdout.write(chunk)
      }
    })

    cp.stderr.on('data', chunk => {
      this._stderr = Buffer.concat([this._stderr, chunk])

      if(this._debug) {
        process.stderr.write(chunk)
      }
    })

    await new Promise<void>((resolve) => {
      cp.on('close', () => { resolve() })
    })
    
    if(this._debug) {
      console.log(`\n\nCommand exited with exit-code: ${cp.exitCode}, signal: ${cp.signalCode}.\n`)
    }

    if(cp.exitCode !== 0) {
      throw new Error(`command "${this._command}" exited with code ${cp.exitCode}`);
    } else if(cp.exitCode === null) {
      throw new Error(`command "${this._command}" exited with signal ${cp.signalCode}`);
    }
    
    return cp;
  }


  async run(): Promise<void> {
    await this._execute();
  }

  async json(): Promise<any> {
    await this._execute();

    return JSON.parse(this._stdout.toString())
  }
}
