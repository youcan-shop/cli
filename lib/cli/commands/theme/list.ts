import type { listThemesResponse } from './types';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import messages from '@/config/messages';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner } from '@/utils/common';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'theme:list',
    group: 'theme',
    description: 'List my development themes',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      await LoadingSpinner.exec(
        `${messages.FETCHING_DEV_THEMES}..`,
        async (spinner) => {
          try {
            const devThemes = await cli.client.listThemes() as listThemesResponse;

            spinner.stop();

            if (!devThemes.dev.length)
              return stdout.error(messages.NO_REMOTE_THEMES);

            stdout.table(
              devThemes.dev.map((theme: any) => ({
                Name: theme.name,
                Size: theme.size,
              })),
            );
          }
          catch (err) {
            spinner.error(messages.ERROR_WHILE_FETCHING_DEV_THEMES);
          }
        });
    },
  };
}
