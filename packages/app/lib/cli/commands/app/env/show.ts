import { Color, Session, Tasks } from '@youcan/cli-kit';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';

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
    if (!this.app.remoteConfig) {
      throw new Error('remote app config not loaded');
    }

    this.log();
    this.log(`${Color.yellow('YOUCAN_API_KEY')}=%s`, this.app.remoteConfig.client_id);
    this.log(`${Color.yellow('YOUCAN_API_SECRET')}=%s`, this.app.remoteConfig.client_secret);
    this.log(`${Color.yellow('YOUCAN_API_SCOPES')}=%s`, this.app.remoteConfig.scopes.join(','));
  }
}

export default EnvShow;
