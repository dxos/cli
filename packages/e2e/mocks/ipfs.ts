import express, { Application, Request, Response } from 'express';
import { Server } from 'http';

const PORT = 8888;

export class IPFS {
  private _app: Application = express();

  _server: Server = {} as Server;

  constructor() {
    this._app.use((req: Request, res: Response) => {
      res.sendStatus(200).end();
    })
  }

  async start (): Promise<void> {
    return new Promise(resolve => {
      this._server = this._app.listen(PORT, resolve);
    })
  }

  async stop (): Promise<void> {
    this._server.close();
  }
}
