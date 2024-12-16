import { APP_CONFIG_FILENAME } from "@/constants";
import { App, RemoteAppConfig } from "@/types";
import { AppCommand } from "@/util/app-command";
import { load } from "@/util/app-loader";
import { Color, Env, Filesystem, Http, Path, Session, Tasks } from "@youcan/cli-kit";

class EnvShow extends AppCommand {
    static description = 'Display app environment variables';
    private app!: App;
    private session!: Session.StoreSession;

    async run(): Promise<any> {
      this.app = await load();
      this.session = await Session.authenticate(this);

        await Tasks.run(null, [
            {
              title: 'Syncing app configuration..',
              task: async () => this.syncAppConfig(),
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
    await this.log(Color.green('SCOPES') + '=%s', this.app.remoteConfig.scopes.join(','));
  }

    private async syncAppConfig(): Promise<void> {    
      const endpoint = this.app.config.id == null
          ? `${Env.apiHostname()}/apps/create`
          : `${Env.apiHostname()}/apps/${this.app.config.id}/update`;

        const res = await Http.post<RemoteAppConfig>(endpoint, {
          headers: { Authorization: `Bearer ${this.session.access_token}` },
          body: JSON.stringify({
            name: this.app.config.name,
            app_url: this.app.config.app_url,
            redirect_urls: this.app.config.redirect_urls,
          }),
        });
        
    
        this.app.config = {
          name: res.name,
          id: res.id,
          app_url: res.app_url,
          redirect_urls: res.redirect_urls,
          oauth: {
            scopes: res.scopes,
            client_id: res.client_id,
          },
        };
    
        await Filesystem.writeJsonFile(
          Path.join(this.app.root, APP_CONFIG_FILENAME),
          this.app.config,
        );
    
        this.app.remoteConfig = res;
      }
}

export default EnvShow;
