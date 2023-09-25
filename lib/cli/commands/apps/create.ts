import fs from 'fs';
import prompts from 'prompts';
import type { PromptObject } from 'prompts';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import stdout from '@/utils/system/stdout';
import messages from '@/config/messages';
import { LoadingSpinner } from '@/utils/common';

export default function command(cli: CLI): CommandDefinition {
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

        const appPath = `./${app.name}`;

        fs.mkdir(appPath, (err: any) => {
          if (err)
            loading.error(`Error creating directory: ${err}`);
        });

        const packageContent = {
          name: app.name,
          version: '0.0.1',
          description: 'Your package description',
          main: 'index.js',
          scripts: {
            start: `node index.js && youcan apps:install -n ${app.name}`,
          },
          dependencies: {},
        };

        fs.writeFile(`${appPath}/package.json`, JSON.stringify(packageContent, null, 2), (err: any) => {
          if (err)
            stdout.error(`Error creating the package.json file: ${err}`);
        });

        fs.writeFile(`${appPath}/index.js`, 'console.log(\'Hello, World!\')', (err: any) => {
          if (err)
            stdout.error(`Error creating the index.js file: ${err}`);
        });

        loading.stop();
      }
      catch (err: any) {
        const error = JSON.parse(err.message);
        loading.error(error.detail);
      }
    },
  };
}
