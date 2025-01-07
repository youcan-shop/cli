import type { App, RemoteAppConfig } from '@/types';
import type { Session } from '@youcan/cli-kit';
import { APP_CONFIG_FILENAME } from '@/constants';
import { Cli, Env, Filesystem, Http, Path } from '@youcan/cli-kit';

export abstract class AppCommand extends Cli.Command {
  protected app!: App;
  protected session!: Session.StoreSession;

  public async syncAppConfig(): Promise<App> {
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

    this.app.remote_config = res;

    return this.app;
  }
}
