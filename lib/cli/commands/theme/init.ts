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
import pushTheme from '@/core/pushTheme';

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

export default function command(cli: CLI): CommandDefinition {
  return {
    name: 'init',
    group: 'theme',
    description: 'Create a new theme or clone existing one.',
    options: [
      { name: '-t, --theme <theme>', description: 'A git repository to clone instead of the starter theme.' },
    ],

    action: async (options: Record<string, string>) => {
      if (!cli.client.isAuthenticated())
        return stdout.error('You must be logged into a store to use this command.');

      const info = await prompts(inquiries) as Omit<InitThemeRequest, 'archive'>;

      stdout.info('Cloning your theme from github');
      cloneRepository(options.theme || config.STARTER_THEME_GIT_REPOSITORY, info.theme_name);

      const zippedTheme = await zipFolder(cwd(), info.theme_name);
      const themeFolderRs = await fileFromPath(zippedTheme);

      const id = await cli.client.initTheme({ ...info, archive: themeFolderRs });
      writeToFile(path.resolve(cwd(), '.youcan'), JSON.stringify({ theme_id: id }));

      stdout.info(`The theme has been initiated with id ${id}`);
    },
  };
}
