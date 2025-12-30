import { getAppEnvironmentVariables } from '@/cli/services/environment-variables';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { Flags } from '@oclif/core';
import { Color, Filesystem, Path, Session, Tasks, UI } from '@youcan/cli-kit';

class EnvPull extends AppCommand {
  static description = 'Create or update a .env file with app environment variables';

  static flags = {
    'env-file': Flags.string({
      description: 'Path to the .env file to create or update',
      default: '.env',
    }),
  };

  async run(): Promise<any> {
    const { flags } = await this.parse(EnvPull);
    const envFilePath = Path.resolve(flags['env-file']);

    this.app = await load();
    this.session = await Session.authenticate(this);

    await Tasks.run({}, [
      {
        title: 'Syncing app configuration..',
        task: async () => { await this.syncAppConfig(); },
      },
    ]);

    await this.writeEnvFile(envFilePath);
  }

  private async writeEnvFile(filePath: string) {
    const envVars = getAppEnvironmentVariables(this.app);

    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await Filesystem.writeFile(filePath, `${envContent}\n`);

    this.log();
    this.log(`${Color.green('[OK]')} Environment variables written to ${Color.cyan(filePath)}`);
    this.log();
  }
}

export default EnvPull;
