import { getAppEnvironmentVariables } from '@/cli/services/environment-variables';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { Color, Env, Session, Tasks } from '@youcan/cli-kit';

class EnvShow extends AppCommand {
  static description = 'Display app environment variables';

  async run(): Promise<any> {
    this.app = await load();
    this.session = await Session.authenticate(this);

    await Tasks.run({}, [
      {
        title: 'Syncing app configuration..',
        task: async () => { await this.syncAppConfig(); },
      },
    ]);

    await this.printEnvironmentVariables();
  }

  private async printEnvironmentVariables() {
    const envVars = getAppEnvironmentVariables(this.app);

    this.log();
    for (const [key, value] of Object.entries(envVars)) {
      this.log(`${Color.yellow(key)}=${value}`);
    }
  }
}

export default EnvShow;
