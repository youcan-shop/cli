import { cwd } from 'process';
import { Flags } from '@oclif/core';
import { Cli, Path } from '@youcan/cli-kit';
import initPrompt from '../prompts/prompt';

export default class Init extends Cli.Command {
  static aliases: string[] = ['create-app'];
  static description = 'bootstaps a new youcan app';

  static flags = {
    ...Cli.commonFlags,
    name: Flags.string({
      char: 'n',
      env: 'YC_FLAG_NAME',
      hidden: false,
    }),
    path: Flags.string({
      char: 'p',
      env: 'YC_FLAG_PATH',
      parse: async input => Path.resolve(input),
      default: async () => cwd(),
      hidden: false,
    }),
    package_manager: Flags.string({
      char: 'd',
      env: 'YC_FLAG_PACKAGE_MANAGER',
      hidden: false,
      options: ['npm', 'pnpm'],
    }),
  };

  public async run(): Promise<void> {
    initPrompt(this, { directory: cwd() });
  }
}
