import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import messages from '@/config/messages';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'apps:install',
    group: 'apps',
    description: 'Generate app installation url',
    options: [
      { name: '-n, --name <app>', description: 'Specify a app name e.g. codmanager' },
    ],

    action: async (options: Record<string, string>) => {
      if (!cli.client.isAuthenticated()) {
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);
      }

      try {
        const response = await cli.client.generateAppInstallationUrl(options.name);

        stdout.info(`To test the app within your store hit the following url : ${response.url}`);
      }
      catch (err: any) {
        const error = JSON.parse(err.message);

        stdout.error(error);
      }
    },
  };
}
