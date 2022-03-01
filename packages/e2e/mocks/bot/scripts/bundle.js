const { buildBot } = require('@dxos/botkit/dist/src/botkit');

buildBot({ 
  entryPoint: './test-bot.ts',
  outfile: './out/main.js'
});
