import fs from 'fs';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import messages from '@/config/messages';
import cli from '@/cli';

export default function command(_cli: CLI): CommandDefinition {
  return {
    name: 'apps:install',
    group: 'apps',
    description: 'Generate app installation url',

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);
      try {
        fs.readFile('package.json', 'utf8', async (err, data) => {
          if (err) {
            stdout.error(`Error reading package.json:${err}`);
            return;
          }

          const packageData = JSON.parse(data);
          const appName = packageData.name;

          const response = await cli.client.generateAppInstallationUrl(appName);
          stdout.info(`To test the app within your store hit the following url : ${response.url}`);
        });
      }
      catch (err: any) {
        const error = JSON.parse(err.message);
        stdout.error(error);
      }
    },
  };
}

