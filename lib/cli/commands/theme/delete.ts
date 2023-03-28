import prompts from 'prompts';
import type { listThemesResponse } from './types';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import messages from '@/config/messages';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner } from '@/utils/common';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'theme:delete',
    group: 'theme',
    description: 'Delete a remote development theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      const { dev: devThemes } = await cli.client.listThemes() as listThemesResponse;

      if (!devThemes.length)
        return stdout.error(messages.NO_REMOTE_THEMES);

      const choices = devThemes.map(theme => ({
        title: theme.name,
        value: theme.id,
      }));

      const { themeId } = await prompts({
        type: 'select',
        name: 'themeId',
        message: messages.DELETE_SELECT_THEME,
        choices,
      });

      if (!themeId)
        return stdout.error(messages.DELETE_NO_THEME_SELECTED);

      await LoadingSpinner.exec(
        `${messages.DELETE_IN_PROGRESS} ${themeId}..`,
        async (spinner) => {
          try {
            await cli.client.deleteTheme(themeId);
          }
          catch (err) {
            spinner.error(messages.DELETE_ERROR);
          }
        });

      stdout.info(messages.DELETE_THEME_DELETED);
    },
  };
}
