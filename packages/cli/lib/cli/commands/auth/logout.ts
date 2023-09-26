import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import messages from '@/config/messages';
import deleteFile from '@/utils/system/deleteFile';
import stdout from '@/utils/system/stdout';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'logout',
    group: 'auth',
    description: 'Log out from the current store',

    action: async () => {
      if (!cli.client.isAuthenticated()) {
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);
      }

      deleteFile(config.CLI_GLOBAL_CONFIG_PATH);

      stdout.info(messages.AUTH_USER_LOGGED_OUT);
    },
  };
}
