import prompts from 'prompts';
import type { listStoresResponse } from './types';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import messages from '@/config/messages';
import stdout from '@/utils/system/stdout';
import { LoadingSpinner } from '@/utils/common';
import type { StoreInfoResponse } from '@/core/client/types';
import writeToFile from '@/utils/system/writeToFile';
import config from '@/config';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'store:switch',
    group: 'theme',
    description: 'Switch the development store',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated()) {
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);
      }

      let storeInfo: any;

      await LoadingSpinner.exec(
        `${messages.FETCHING_CURRENT_STORE_INFO}..`,
        async (spinner) => {
          try {
            storeInfo = await cli.client.getStoreInfo() as StoreInfoResponse;
          }
          catch (err) {
            spinner.error(messages.ERROR_WHILE_FETCHING_CURRENT_STORE_INFO);
          }
        });

      stdout.info(`${messages.CURRENT_DEVELOPMENT_STORE}: ${storeInfo.slug}`);

      const { stores } = await cli.client.listStores() as listStoresResponse;

      if (!stores.length) {
        return stdout.error(messages.NO_STORE_FOUND);
      }

      const choices = stores.map(store => ({
        title: store.slug,
        value: store.store_id,
      }));

      const { storeId } = await prompts({
        type: 'select',
        name: 'storeId',
        message: messages.SELECT_STORE,
        choices,
      });

      if (!storeId) {
        return stdout.error(messages.NO_STORE_SELECTED);
      }

      await LoadingSpinner.exec(
        `${messages.SELECT_STORE_IN_PROGRESS}..`,
        async (spinner) => {
          try {
            const selectStoreResponse = await cli.client.selectStore({ id: storeId });

            writeToFile(
              config.CLI_GLOBAL_CONFIG_PATH,
              JSON.stringify({ access_token: selectStoreResponse.token }),
            );
          }
          catch (err) {
            spinner.error(messages.CANNOT_SELECT_STORE);
          }
        });

      stdout.info(messages.STORE_SELECTED);
    },
  };
}
