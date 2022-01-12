//
// Copyright 2021 DXOS.org
//

import { createIpcPort, startBot, ClientBot } from '@dxos/botkit';

if (typeof require !== 'undefined' && require.main === module) {
  const port = createIpcPort(process);
  void startBot(new ClientBot(), port);
}
