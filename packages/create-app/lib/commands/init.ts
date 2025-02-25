import { cwd } from 'node:process';
import initPrompt from '@/prompts/init';
import initService from '@/services/init';
import { Flags } from '@oclif/core';
import { Cli, Path, System } from '@youcan/cli-kit';

export default class Init extends Cli.Command {
  static aliases: string[] = ['create-app'];
  static description = 'bootstraps a new youcan app';

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

    if (
      typeof response.name === 'undefined'
      || typeof response.template === 'undefined'
    ) {
      this.log('Operation cancelled');
      this.exit(130);
    }

    await initService(this, {
      name: response.name,
      directory: flags.path,
      template: response.template,
      packageManager: System.inferUserPackageManager(),
    });
  }
}
