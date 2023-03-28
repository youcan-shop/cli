import { cwd } from 'process';
import type { CLI, CommandDefinition } from '../types';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner, getCurrentDate, getCurrentThemeId } from '@/utils/common';
import messages from '@/config/messages';
import { zipDirectory } from '@/utils/system/zipFolder';
import config from '@/config';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'theme:pack',
    group: 'theme',
    description: 'Package a theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      if (!await getCurrentThemeId(cwd()))
        return stdout.error('No theme found in the current directory');

      const loading = new LoadingSpinner('📦 Packaging your theme');
      loading.start();

      const exportFolder = `theme_${getCurrentDate()}`;
      await zipDirectory(cwd(), exportFolder, config.THEME_FILE_TYPES);
      loading.stop();

      return stdout.info(`your theme was successfully packaged to ${exportFolder}`);
    },
  };
}
