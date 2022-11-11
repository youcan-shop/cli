import { cwd } from 'process';
import { readFileSync } from 'fs';
import chokidar from 'chokidar';
import type { CLI, CommandDefinition } from '../types';
import stdout from '@/utils/system/stdout';
import { getCurrentThemeId } from '@/utils/common';
import config from '@/config';

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
        .on('change', (path) => {
          const [filetype, filename] = path.split('/', 2);

          if (!config.THEME_FILE_TYPES.includes(filetype))
            return;

          cli.client.updateFile(themeId, {
            file_type: filetype,
            file_name: filename,
            file_operation: 'save',
            file_content: readFileSync(path, { encoding: 'utf-8', flag: 'r' }),
          });
        })
        .on('unlink', (path) => {
          const [filetype, filename] = path.split('/', 2);

          if (!config.THEME_FILE_TYPES.includes(filetype))
            return;

          cli.client.updateFile(themeId, {
            file_type: filetype,
            file_name: filename,
            file_operation: 'delete',
          });
        });
    },
  };
}
