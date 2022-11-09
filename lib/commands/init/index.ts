import cloneRepository from '@/utils/git/cloneRepository';
import stdout from '@/utils/system/stdout';

/**
 * YouCan CLI - Init command
 */
function initAction() {
  stdout.info('initializing a new theme');
  cloneRepository('git@github.com:NextmediaMa/youcan-cli.git', '/tmp/ycc');
}

export default {
  setup(cli: any) {
    cli.command('init', '📥 Create a new theme or clone existing one.')
      .option('-n, --name', 'What to name the theme, cloned files will be unpacked into a folder with this name.')
      .option('-t, --theme', 'A theme to clone, can either be a store theme identifier or a base theme identifier, or name.')
      .action(initAction);
  },
};
