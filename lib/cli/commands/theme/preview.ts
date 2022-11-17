import { cwd } from 'process';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import { getCurrentThemeId } from '@/utils/common';
import previewTheme from '@/core/themes/preview';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'preview',
    group: 'theme',
    description: 'Live preview for your theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const themeId = await getCurrentThemeId(cwd());

      if (!themeId)
        return stdout.error('No theme detected in the current directory.');

      previewTheme(themeId);

      stdout.info('Preview browser opened, waiting for theme changes...');
    },
  };
}
