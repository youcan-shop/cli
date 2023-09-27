import { cwd } from 'process';
import { Flags } from '@oclif/core';
import { Cli, Path } from '@youcan/cli-kit';
import initPrompt from '@/prompts/init';
import initService from '@/services/init';

export default class Init extends Cli.Command {
  static aliases: string[] = ['create-app'];
  static description = 'bootstaps a new youcan app';

  static flags = {
    ...Cli.commonFlags,
    path: Flags.string({
      char: 'p',
      env: 'YC_FLAG_PATH',
      parse: async input => Path.resolve(input),
      default: async () => cwd(),
      hidden: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const response = await initPrompt(this);

    await initService(this, {
      name: response.name,
      directory: flags.path,
      template: response.template,
    });
  }
}
