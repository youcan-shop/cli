import type { CLI, CommandDefinition } from '../types';
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

      stdout.info('Delete a theme');
    },
  };
}
