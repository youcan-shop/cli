import { exit } from 'process';
import prompts from 'prompts';
import type { PromptObject } from 'prompts';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import stdout from '@/utils/system/stdout';
import writeToFile from '@/utils/system/writeToFile';
import messages from '@/config/messages';
import { getPidByPort, isPortAvailable } from '@/utils/network';
import { kill } from '@/utils/system';
import { LoadingSpinner } from '@/utils/common';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'login',
    group: 'auth',
    description: 'Log into a YouCan store',

    action: async () => {
      if (!(await isPortAvailable(config.OAUTH_CALLBACK_PORT))) {
        stdout.warn(`YouCan CLI requires that the port ${config.OAUTH_CALLBACK_PORT} be available`);
        const prompt = await prompts({
          initial: false,
          type: 'confirm',
          name: 'terminate',
          message: 'Terminate the process to free the port?',
        });

        if (!prompt.terminate) {
          stdout.log('Exiting..');
          exit(1);
        }

        const pid = await getPidByPort(config.OAUTH_CALLBACK_PORT);

        if (pid) {
          await LoadingSpinner.exec(
            `Terminating process ${pid}..`,
            async (spinner) => {
              try {
                await kill(pid, 'SIGTERM', 30_000);
              }
              catch (err) {
                spinner.error('Could not terminate process, proceeding..');
              }
            });
        }
      }

      const loading = new LoadingSpinner('Authenticating...');

      try {
        const inquiries: PromptObject[] = [
          {
            type: 'text',
            name: 'email',
            message: 'Type your email',
            validate: value => value !== '',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Type your password',
            validate: value => value !== '',
          },
        ];

        const credentials = await prompts(inquiries);

        loading.start();
        const response = await cli.client.auth({ email: credentials.email, password: credentials.password });
        let token = response.token;

        loading.stop();

        cli.client.setAccessToken(response.token);

        if (response.stores.length > 1) {
          const choices = response.stores.map(store => ({
            title: store.slug,
            value: store.store_id,
          }));

          const { storeId } = await prompts({
            type: 'select',
            name: 'storeId',
            message: messages.SELECT_STORE,
            choices,
          });

          const selectStoreResponse = await cli.client.selectStore({ id: storeId });

          token = selectStoreResponse.token;
        }

        writeToFile(
          config.CLI_GLOBAL_CONFIG_PATH,
          JSON.stringify({ access_token: token }),
        );

        stdout.info(messages.LOGIN_SUCCESS);
      }
      catch (err: any) {
        const error = JSON.parse(err.message);

        loading.error(error.detail);
      }
    },
  };
}
