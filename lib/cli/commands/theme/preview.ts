import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import config from '@/config';
import openLink from '@/utils/system/openLink';

function listenForThemeChange() {
  const httpServer = createServer((request, response) => {
    const filePath = path.resolve('../lib/static/preview.html');
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(response);
  });
  const io = new Server(httpServer);

  io.on('connection', (socket: Socket) => {
    socket.on('theme-change', () => {
      stdout.log('Theme change detected, reloading...');
      io.emit('reload');
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
