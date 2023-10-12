import { Cli } from '@youcan/cli-kit';
import { CONFIGURATION_FILE_NAME } from '@/constants';

export abstract class ThemeCommand extends Cli.Command {
  protected configFileName() {
    return CONFIGURATION_FILE_NAME;
  }
}