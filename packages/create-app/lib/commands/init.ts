import { cwd } from 'process';
import { Flags } from '@oclif/core';
import { Cli, Path } from '@youcan/cli-kit';
import initPrompt from '@/prompts/init';
import initService from '@/services/init';

function inferUsedPackageManager(): string
{
  const pmsMap = {
    'x': 'npm',
    'y': 'yarn',
    'z': 'yarn',
    'default': 'npm'
  };

  const packageManger = process.env['npm_execpath'] ?? 'default';

  console.log(process.env);

  process.exit(1);
  

  return 'ok';
}

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
    console.log(inferUsedPackageManager());
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
      packageManager: 'pnpm'
    });
  }
}
