import { cwd } from 'process';
import { readFileSync } from 'fs';
import chokidar from 'chokidar';
import kleur from 'kleur';
import { path } from 'ramda';
import type { CLI, CommandDefinition } from '../types';
import stdout from '@/utils/system/stdout';
import { getCurrentThemeId } from '@/utils/common';
import config from '@/config';

function logFileEvent(key: string, path: string) {
  const tag = `[${kleur.bold().green(key)}]`;
  return stdout.log(`${tag} ${path}`);
}

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'dev',
    group: 'theme',
    description: 'stats a dev server and watches over the current directory',

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const themeId = await getCurrentThemeId(cwd());

      chokidar
        .watch(config.THEME_FILE_TYPES, {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
          },
        })
        .on('all', (event, path) => {
          const [filetype, filename] = path.split('/', 2);

          if (!config.THEME_FILE_TYPES.includes(filetype))
            return;

          logFileEvent(event, path);

          switch (event) {
            case 'add' || 'change':
              cli.client.updateFile(themeId, {
                file_type: filetype,
                file_name: filename,
                file_operation: 'save',
                file_content: readFileSync(path, { encoding: 'utf-8', flag: 'r' }),
              });
              break;
            case 'unlink':
              cli.client.deleteFile(themeId, {
                file_type: filetype,
                file_name: filename,
                file_operation: 'delete',
              });
              break;
          }
        });
    },
  };
}
