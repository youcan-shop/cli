import { AppCommand } from "@/util/app-command";
import { load } from "@/util/app-loader";
import { Color, Session, Tasks } from "@youcan/cli-kit";

class EnvShow extends AppCommand {
    static description = 'Display app environment variables';

    async run(): Promise<any> {
      this.app = await load();
      this.session = await Session.authenticate(this);

        await Tasks.run(null, [
            {
              title: 'Syncing app configuration..',
              task: async () => { await this.syncAppConfig() },
            },
        ]);

      await this.printEnvVars();
    }

  private async printEnvVars() {
    if (!this.app.remoteConfig) {
      throw new Error('remote app config not loaded');
    }

    await this.log();
    await this.log(Color.green('YOUCAN_API_KEY') + '=%s', this.app.remoteConfig.client_id);
    await this.log(Color.green('YOUCAN_API_SECRET') + '=%s', this.app.remoteConfig.client_secret);
    await this.log(Color.green('YOUCAN_API_SCOPES') + '=%s', this.app.remoteConfig.scopes.join(','));
  }
}

export default EnvShow;
