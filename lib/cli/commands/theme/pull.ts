import { cwd } from 'process';
import prompts from 'prompts';
import decompress from 'decompress';
import type { CLI, CommandDefinition } from '../types';
import type { listThemesResponse } from './types';
import stdout from '@/utils/system/stdout';
import { saveHttpFile } from '@/utils/system/saveFile';
import { getCurrentThemeId } from '@/utils/common';
import writeToFile from '@/utils/system/writeToFile';
import deleteFile from '@/utils/system/deleteFile';

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
      let themeId;
      const cwdThemeId = await getCurrentThemeId(cwd());

      stdout.log(`${cwdThemeId}`);

      if (!cwdThemeId) {
        const promt = await prompts({
          type: 'select',
          name: 'themeId',
          message: 'Select a theme to pull',
          choices,
        });
        themeId = promt.themeId;
      }
      else {
        themeId = cwdThemeId;
      }

      if (!themeId) return stdout.error('No theme found');

      const fileName = `${themeId}`;
      const fileNameZip = `${fileName}.zip`;

      stdout.info('Pulling your theme...');
      const response = await cli.client.pullTheme(themeId);
      await saveHttpFile(response, fileNameZip);

      stdout.info('Unpacking...');
      const unpackingFolder = cwdThemeId ? cwd() : `${cwd()}/${fileName}`;
      await decompress(fileNameZip, unpackingFolder);

      deleteFile(fileNameZip);

      writeToFile(`${unpackingFolder}/.youcan`, JSON.stringify({ theme_id: themeId }));

      stdout.info(`Theme has been pulled to ${fileName}`);
    },
  };
}
