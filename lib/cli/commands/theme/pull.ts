import prompts from 'prompts';
import decompress from 'decompress';
import type { CLI, CommandDefinition } from '../types';
import type { listThemesResponse } from './types';
import stdout from '@/utils/system/stdout';
import { downloadFile } from '@/utils/system/download';
import config from '@/config';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'pull',
    group: 'theme',
    description: 'Pull a theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const { dev } = await cli.client.listThemes() as listThemesResponse;

      const choices = dev.map(theme => ({
        title: theme.name,
        value: theme.id,
      }));

      const { themeId } = await prompts({
        type: 'select',
        name: 'themeId',
        message: 'Select a theme to pull',
        choices,
      });

      if (!themeId) return stdout.error('No theme selected');

      const fileName = `${themeId}`;
      const fileNameZip = `${fileName}.zip`;

      stdout.info('Pulling your theme...');
      await downloadFile(`${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}`, fileNameZip, {
        Authorization: `Bearer ${cli.client.accessToken}`,
        Accept: 'application/json',
      });

      stdout.info('Unpacking...');
      decompress(fileNameZip, fileName).then(() => {
        stdout.info(`Theme has been pulled to ${fileName}`);
      });
    },
  };
}
