import { cwd } from 'process';
import { clear } from 'console';
import { existsSync, readFileSync } from 'fs';
import crypto from 'crypto';
import chokidar from 'chokidar';
import kleur from 'kleur';
import { fileFromPathSync } from 'formdata-node/file-from-path';
import io from 'socket.io-client';
import type { CLI, CommandDefinition } from '../types';
import type { FileEventOptions } from './types';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner, getCurrentThemeId } from '@/utils/common';
import config from '@/config';
import previewTheme from '@/core/themes/preview';
import type { ThemeMetaResponse } from '@/core/client/types';

const sizeFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

const eventLogTagMap: { [key: string]: () => string } = {
  error: () => kleur.bold().red('[error]'),
  add: () => kleur.bold().green('[created]'),
  change: () => kleur.bold().blue('[updated]'),
  unlink: () => kleur.bold().yellow('[deleted]'),
};

function logFileEvent(options: FileEventOptions) {
  const tag = eventLogTagMap[options.event]();

  return stdout.log(`${tag} ${kleur.underline().white(options.path)} - ${sizeFormatter.format(options.size)} | ${options.roundtrip}ms \n`);
}

function connectPreviewServer() {
  const socket = io(`ws://localhost:${config.PREVIEW_SERVER_PORT}`);
  socket.on('connect', () => {
    stdout.log('Connected to preview server');
  });
  return socket;
}

async function syncChanges(cli: CLI, themeId: string) {
  const meta = await cli.client.getThemeMeta(themeId);

  for (const fileType of config.THEME_FILE_TYPES) {
    const files: any = meta[fileType as keyof ThemeMetaResponse];
    for (const file of files) {
      const filePath = `${file.type}/${file.file_name}`;

      if (!existsSync(filePath)) {
        await cli.client.deleteFile(themeId, {
          file_type: file.type,
          file_name: file.file_name,
          file_operation: 'delete',
        });
        continue;
      }
      const fileStream = readFileSync(filePath);
      const localHash = crypto.createHash('sha1');
      localHash.update(fileStream);

      if (localHash.digest('hex') !== file.hash) {
        await cli.client.updateFile(themeId, {
          file_type: file.type,
          file_name: file.file_name,
          file_operation: 'save',
          file_content: fileFromPathSync(filePath),
        });
      }
    }
  }
}

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'dev',
    group: 'theme',
    description: 'starts a dev server and watches over the current directory',
    options: [
      { name: '-p, --preview', description: 'opens a preview window' },
    ],
    action: async (options: Record<string, string>) => {
      let socket: ReturnType<typeof io>;

      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const themeId = await getCurrentThemeId(cwd());

      if (!themeId)
        return stdout.error('No theme detected in the current directory.');

      const { domain } = await cli.client.getStoreInfo();

      clear();

      const loadingSpinner = new LoadingSpinner('Syncing changes...');
      loadingSpinner.start();
      await syncChanges(cli, themeId);
      loadingSpinner.stop();

      if (options.preview) {
        socket = connectPreviewServer();
        socket.emit('theme:dev', { themeId });

        previewTheme(`https://${domain}/themes/${themeId}/preview`);
      }

      stdout.info(`Watching for changes in ${kleur.bold().white(cwd())}...`);

      chokidar
        .watch(config.THEME_FILE_TYPES, {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
          },
        })
        .on('all', async (event, path, stats) => {
          const start = new Date().getTime();

          try {
            const [filetype, filename] = path.split('/', 2);

            if (!config.THEME_FILE_TYPES.includes(filetype))
              return;

            if (!['add', 'change', 'unlink'].includes(event))
              return;

            switch (event) {
              case 'add':
              case 'change':
                await cli.client.updateFile(themeId, {
                  file_type: filetype,
                  file_name: filename,
                  file_operation: 'save',
                  file_content: fileFromPathSync(path),
                });

                break;
              case 'unlink':
                await cli.client.deleteFile(themeId, {
                  file_type: filetype,
                  file_name: filename,
                  file_operation: 'delete',
                });

                break;
            }

            if (socket) socket.emit('theme:update', { themeId });

            logFileEvent({
              path,
              event,
              size: stats?.size ?? 0,
              roundtrip: new Date().getTime() - start,
            });
          }

          catch (err) {
            logFileEvent({
              path,
              event: 'error',
              size: stats?.size ?? 0,
              roundtrip: new Date().getTime() - start,
            });

            if (err instanceof Error)
              stdout.info(`message: ${err.message}`);
          }
        });
    },
  };
}
