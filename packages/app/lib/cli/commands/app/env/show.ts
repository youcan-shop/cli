import { Color, Session, Tasks } from '@youcan/cli-kit';
import { getAppEnvironmentVariables } from '@/cli/services/environment-variables';
import { AppCommand, configFlag } from '@/util/app-command';
import { load } from '@/util/app-loader';

class EnvShow extends AppCommand {
  static description = 'Display app environment variables';

  static flags = {
    ...configFlag,
  };

  async run(): Promise<any> {
    const { flags } = await this.parse(EnvShow);

    this.app = await load(flags.config);
    this.session = await Session.authenticate(this);

    if (!this.app.config.id) {
      this.output.error('This app has no remote counterpart yet, run `youcan app dev` first.');
    }

    await Tasks.run({}, [
      {
        title: 'Fetching app configuration..',
        task: async () => { await this.fetchRemoteConfig(); },
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
