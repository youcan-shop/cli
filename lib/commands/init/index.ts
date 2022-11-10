import config from '@/config';
import pushTheme from '@/core/pushTheme';
import cloneRepository from '@/utils/git/cloneRepository';
import stdout from '@/utils/system/stdout';
import writeToFile from '@/utils/system/writeToFile';

/**
 * YouCan CLI - Init command
 */
async function initAction(options: any) {
  const { themeRepository, themeName } = config.starterTheme;
  const themeFolderName = options.name || themeName;

  stdout.info('Cloning the starter theme...');
  cloneRepository(themeRepository, themeFolderName);

  const themeId = await pushTheme(themeFolderName);
  writeToFile(`${themeFolderName}/.youcan`, `theme=${themeId}`);

  stdout.info('The theme has been initiated 🥳');
}

export default {
  setup(cli: any) {
    cli.command('init', '📥 Create a new theme or clone existing one.')
      .option('-n, --name <name>', 'What to name the theme, cloned files will be unpacked into a folder with this name.')
      .option('-t, --theme <theme>', 'A theme to clone, can either be a store theme identifier or a base theme identifier, or name.')
      .action(initAction);
  },
};
