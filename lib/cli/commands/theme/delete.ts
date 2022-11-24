import prompts from 'prompts';
import type { CLI, CommandDefinition } from '../types';
import type { listThemesResponse } from './types';
import stdout from '@/utils/system/stdout';
import messages from '@/config/messages';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'delete',
    group: 'theme',
    description: 'Delete a theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      const { dev } = await cli.client.listThemes() as listThemesResponse;
      const choices = dev.map(theme => ({
        title: theme.name,
        value: theme.id,
      }));

      const { themeId } = await prompts({
        type: 'select',
        name: 'themeId',
        message: messages.DELETE_PROMPTS_SELECT_THEME,
        choices,
      });
      if (!themeId) return stdout.error(messages.DELETE_NO_THEME_SELECTED);

      await cli.client.deleteTheme(themeId);
      stdout.info(messages.DELETE_THEME_DELETED);
    },
  };
}
