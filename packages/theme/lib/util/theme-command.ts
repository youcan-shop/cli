import { Cli } from '@youcan/cli-kit';
import { THEME_CONFIG_FILENAME } from '@/constants';

export abstract class ThemeCommand extends Cli.Command {
  protected configFileName() {
    return THEME_CONFIG_FILENAME;
  }
}
