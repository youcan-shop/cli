import { cwd } from 'process';
import path from 'path';
import type { PromptObject } from 'prompts';
import prompts from 'prompts';
import { fileFromPath } from 'formdata-node/file-from-path';
import type { CLI, CommandDefinition } from '@/cli/commands/types';
import config from '@/config';
import cloneRepository from '@/utils/git/cloneRepository';
import stdout from '@/utils/system/stdout';
import type { InitThemeRequest } from '@/core/client/types';
import zipFolder from '@/utils/system/zipFolder';
import writeToFile from '@/utils/system/writeToFile';
import deleteFile from '@/utils/system/deleteFile';
import messages from '@/config/messages';

const inquiries: PromptObject[] = [
  {
    type: 'text',
    name: 'theme_name',
    message: 'The theme\'s name, used for display purposes.',
    initial: 'Starter',
  },
  {
    type: 'text',
    name: 'theme_author',
    message: 'The theme\'s author',
    initial: 'YouCan',
  },
  {
    type: 'text',
    name: 'theme_version',
    message: 'The theme\'s current version',
    initial: '1.0.0',
  },
  {
    type: 'text',
    name: 'theme_support_url',
    message: 'A support URL for this theme.',
    initial: 'https://developer.youcan.shop',
  },
  {
    type: 'text',
    name: 'theme_documentation_url',
    message: 'A documentation URL for this theme.',
    initial: 'https://developer.youcan.shop',
  },
];

const defaultInquiries = {
  theme_name: 'Starter',
  theme_author: 'YouCan',
  theme_version: '1.0.0',
  theme_support_url: 'https://developer.youcan.shop',
  theme_documentation_url: 'https://developer.youcan.shop',
};

function getSelectedTheme(optionTheme: string): string {
  const selectedTheme = config.AVAILABLE_THEMES.find(theme => theme.name === optionTheme?.toLocaleLowerCase().trim())?.repository;

  if (selectedTheme) return selectedTheme;

  return config.STARTER_THEME_GIT_REPOSITORY;
}

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'init',
    group: 'theme',
    description: 'Create a new theme or clone existing one.',
    options: [
      { name: '-t, --theme <theme>', description: 'Specify a theme name e.g. cod-theme' },
      { name: '-d, --default', description: 'Use default values for theme name, author, version, support url and documentation url.' },
    ],

    action: async (options: Record<string, string>) => {
      if (!cli.client.isAuthenticated())
        return stdout.error(messages.AUTH_USER_NOT_LOGGED_IN);

      const info = options.default ? defaultInquiries : await prompts(inquiries) as Omit<InitThemeRequest, 'archive'>;

      stdout.info(messages.INIT_CLONE_START);

      const themeRepository = getSelectedTheme(options.theme);

      cloneRepository(themeRepository, info.theme_name);

      const zippedTheme = await zipFolder(cwd(), info.theme_name);
      const themeFolderRs = await fileFromPath(zippedTheme);

      const id = await cli.client.initTheme({ ...info, archive: themeFolderRs });
      writeToFile(path.resolve(cwd(), info.theme_name, '.youcan'), JSON.stringify({ theme_id: id }));

      deleteFile(zippedTheme);

      stdout.info(`${messages.INIT_SUCCESS}${id}`);
    },
  };
}
