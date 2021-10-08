//
// Copyright 2021 DXOS.org
//

import express, { Application } from 'express';
import { Server } from 'http';

interface Handlers {
  path: string,
  handler: () => any
}

export class HTTPServer {
  private _app: Application = express();

  _server: Server = {} as Server;

  constructor (private readonly _port: number, handlers: Handlers[]) {
    for (const handler of handlers) {
      this._app.use(handler.path, (req, res) => {
        const data = handler.handler();
        res.send(data);
      });
    }
  }

  async start (): Promise<void> {
    return new Promise(resolve => {
      this._server = this._app.listen(this._port, resolve);
    });
  }

  async stop (): Promise<void> {
    this._server.close();
  }
}
