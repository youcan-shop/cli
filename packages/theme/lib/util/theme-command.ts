import { THEME_CONFIG_FILENAME } from '@/constants';
import { Cli } from '@youcan/cli-kit';

export abstract class ThemeCommand extends Cli.Command {
  protected configFileName() {
    return THEME_CONFIG_FILENAME;
  }
}
