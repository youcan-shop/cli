import { Args, Flags } from '@oclif/core';
import { Cli, Path } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import { THEME_FLAGS } from '@/flags';
import { clone } from '@/cli/services/init';

class Init extends ThemeCommand {
  static description = 'Clones a theme template Git repo.';

  static args = {
    name: Args.string({
      name: 'name',
      required: false,
      description: 'A name for the new theme',
    }),
  };

  static flags = {
    ...Cli.commonFlags,
    ...THEME_FLAGS,
    url: Flags.string({
      char: 'u',
      env: 'YC_FLAG_CLONE_URL',
      description: 'The Git URL to clone from',
      default: 'https://github.com/youcan-shop/light-theme',
    }),
  };

  async run(): Promise<any> {
    const { args, flags } = await this.parse(Init);

    const name = args.name || (await prompt(this)).name;

    await clone(flags.url, Path.join(flags.path, name));
  }
}

async function prompt(command: ThemeCommand) {
  return command.prompt({
    name: 'name',
    type: 'text',
    initial: 'light-theme',
    message: 'Your theme\'s name',
    validate: (v: string) => {
      if (!v.length) {
        return 'Theme name cannot be empty';
      }

      if (v.length > 32) {
        return 'Theme name cannot exceed 32 characters';
      }

      return true;
    },
  });
}

export default Init;
