import type { Session } from '@youcan/cli-kit';
import type { App, AppConfig, RemoteAppConfig } from '@/types';
import { Flags } from '@oclif/core';
import { Cli, Env, Filesystem, Http, Path } from '@youcan/cli-kit';

export abstract class AppCommand extends Cli.Command {
  static baseFlags = {
    config: Flags.string({ char: 'c', description: 'Config environment, resolves youcan.app.<env>.json' }),
  };

  protected app!: App;
  protected session!: Session.StoreSession;

  public async fetchRemoteConfig(): Promise<RemoteAppConfig> {
    const res = await Http.get<RemoteAppConfig>(`${Env.apiHostname()}/apps/${this.app.config.id}`);

    this.app.remote_config = res;

    return res;
  }

  public async syncAppConfig(): Promise<App> {
    const created = this.app.config.id == null;

    const endpoint = created
      ? `${Env.apiHostname()}/apps/create`
      : `${Env.apiHostname()}/apps/${this.app.config.id}/update`;

    const res = await Http.post<RemoteAppConfig>(endpoint, {
      headers: { Authorization: `Bearer ${this.session.access_token}` },
      body: JSON.stringify({
        name: this.app.config.name,
        redirect_urls: this.app.config.redirect_urls,
        ...(created ? { app_url: this.app.config.app_url } : {}),
      }),
    });

    this.app.config = {
      ...this.app.config,
      name: res.name,
      id: res.id,
      handle: res.handle,
      app_url: created ? res.app_url : this.app.config.app_url,
      redirect_urls: res.redirect_urls,
      oauth: {
        scopes: res.scopes,
        client_id: res.client_id,
      },
    };

    if (created) {
      await this.persistIdentity(res);
    }

    this.app.remote_config = res;

    return this.app;
  }

  private async persistIdentity(res: RemoteAppConfig): Promise<void> {
    const path = Path.join(this.app.root, this.app.configFilename);
    const disk = await Filesystem.readJsonFile<Partial<AppConfig>>(path).catch(() => ({}));

    await Filesystem.writeJsonFile(path, {
      ...disk,
      name: res.name,
      id: res.id,
      handle: res.handle,
      oauth: {
        scopes: res.scopes,
        client_id: res.client_id,
      },
    });
  }
}
