//
// Copyright 2021 DXOS.org
//

import { createIpcPort, startBot, Bot } from '@dxos/botkit';

if (typeof require !== 'undefined' && require.main === module) {
  const port = createIpcPort(process);
  void startBot(new Bot(), port);
}
