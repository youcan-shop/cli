import prompts from 'prompts';
import type { PromptObject } from 'prompts';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import messages from '@/config/messages';
import { LoadingSpinner } from '@/utils/common';
import cli from '@/cli';

export default function command(_cli: CLI): CommandDefinition {
  return {
    name: 'apps:create',
    group: 'apps',
    description: 'Create your app',

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      const loading = new LoadingSpinner('Creating your app ...');

      try {
        const inquiries: PromptObject[] = [
          {
            type: 'text',
            name: 'name',
            message: 'Type your app name',
            validate: value => value !== '' && value.length > 3,
          },
        ];

        const app = await prompts(inquiries);

        loading.start();
        await cli.client.createApp({ name: app.name });

        loading.stop();
      }
      catch (err: any) {
        const error = JSON.parse(err.message);
        loading.error(error.detail);
      }
    },
  };
}

