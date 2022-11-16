import prompts from 'prompts';
import type { CLI, CommandDefinition } from '../types';
import type { listThemesResponse } from './types';
import stdout from '@/utils/system/stdout';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'delete',
    group: 'theme',
    description: 'Delete a theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');
      const { dev } = await cli.client.listThemes() as listThemesResponse;

      const choices = dev.map(theme => ({
        title: theme.name,
        value: theme.id,
      }));

      const { themeId } = await prompts({
        type: 'select',
        name: 'themeId',
        message: 'Select a theme to delete',
        choices,
      });

      cli.client.deleteTheme(themeId);
      stdout.info('Theme deleted');
    },
  };
}
