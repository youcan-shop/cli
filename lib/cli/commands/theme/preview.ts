import { createServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import config from '@/config';
import openLink from '@/utils/system/openLink';
import previewPage from '@/pages/preview';

async function listenForThemeChange() {
  const httpServer = createServer(async (request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/html',
    },
    );

    response.end(previewPage);
  });
  const io = new Server(httpServer);

  io.on('connection', (socket: Socket) => {
    socket.on('theme:update', (data: any) => {
      stdout.log('Theme change detected, reloading...');
      io.emit('theme:reload', data);
    });
  });

  httpServer.listen(config.PREVIEW_SERVER_PORT);
}

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'preview',
    group: 'theme',
    description: 'Live preview for your theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      openLink(`http://localhost:${config.PREVIEW_SERVER_PORT}`);
      listenForThemeChange();

      stdout.info('The preview link is:');
    },
  };
}
