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
import messages from '@/config/messages';

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'theme:pull',
    group: 'theme',
    description: 'Pull a theme',
    options: [],

    action: async () => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      const { dev } = await cli.client.listThemes() as listThemesResponse;

      const choices = dev.map(theme => ({
        title: theme.name,
        value: theme.id,
      }));
      let themeId;
      const cwdThemeId = await getCurrentThemeId(cwd());

      if (!cwdThemeId) {
        const promt = await prompts({
          type: 'select',
          name: 'themeId',
          message: 'Select a theme to pull',
          choices,
        });
        themeId = promt.themeId;
      }

      themeId = themeId || cwdThemeId;

      if (!themeId) return stdout.error(messages.PULL_NO_THEME_FOUND);

      const fileName = `${themeId}`;
      const fileNameZip = `${fileName}.zip`;

      stdout.info(messages.PULL_PULLING_THEME);
      const response = await cli.client.pullTheme(themeId);
      await saveHttpFile(response, fileNameZip);

      stdout.info(messages.PULL_UNPACKING_THEME);
      const unpackingFolder = cwdThemeId ? cwd() : `${cwd()}/${fileName}`;
      await decompress(fileNameZip, unpackingFolder);

      deleteFile(fileNameZip);

      writeToFile(`${unpackingFolder}/.youcan`, JSON.stringify({ theme_id: themeId }));

      stdout.info(`${messages.PULL_THEME_PULLED} ${fileName}`);
    },
  };
}
