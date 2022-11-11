import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import deleteFile from '@/utils/system/deleteFile';
import stdout from '@/utils/system/stdout';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'logout',
    group: 'auth',
    description: 'Log out from the current store',

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You are not currently logged into any store.');

      deleteFile(config.CLI_GLOBAL_CONFIG_PATH);

      stdout.info('You have been successfully logged out.');
    },
  };
}
