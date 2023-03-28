import type { CLI, CommandDefinition } from '@/cli/commands/types';
import messages from '@/config/messages';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner } from '@/utils/common';
import type { StoreInfoResponse } from '@/core/client/types';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'store:info',
    group: 'theme',
    description: 'Current development store info',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      await LoadingSpinner.exec(
        `${messages.FETCHING_CURRENT_STORE_INFO}..`,
        async (spinner) => {
          try {
            const storeInfo = await cli.client.getStoreInfo() as StoreInfoResponse;

            spinner.stop();

            stdout.info(`${messages.CURRENT_DEVELOPMENT_STORE}: ${storeInfo.slug}`);
          }
          catch (err) {
            spinner.error(messages.ERROR_WHILE_FETCHING_CURRENT_STORE_INFO);
          }
        });
    },
  };
}
