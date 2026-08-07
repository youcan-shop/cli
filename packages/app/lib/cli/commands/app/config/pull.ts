import type { AppConfig, AppVersion, Manifest } from '@/types';
import { Color, Env, Filesystem, Http, Path, Session } from '@youcan/cli-kit';
import { APP_CONFIG_FILENAME } from '@/constants';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';

export default class ConfigPull extends AppCommand {
  static description = 'Update youcan.app.json from the active released version';

  async run() {
    this.session = await Session.authenticate(this);
    this.app = await load();

    if (!this.app.config.id) {
      this.output.error('This app has no remote counterpart yet, run `youcan app dev` first.');
    }

    let version: AppVersion & { manifest: Manifest };
    try {
      version = await Http.get(`${Env.apiHostname()}/apps/${this.app.config.id}/versions/active`);
    }
    catch {
      return this.output.error('This app has no active version yet, run `youcan app deploy` to create one.');
    }

    const path = Path.join(this.app.root, APP_CONFIG_FILENAME);
    const disk = await Filesystem.readJsonFile<AppConfig>(path);
    const config = version.manifest.app;

    await Filesystem.writeJsonFile(path, {
      ...disk,
      name: config.name,
      handle: config.handle ?? disk.handle,
      app_url: config.app_url ?? null,
      redirect_urls: config.redirect_urls ?? [],
      oauth: {
        ...disk.oauth,
        scopes: config.scopes ?? disk.oauth?.scopes ?? [],
      },
    });

    this.log();
    this.log(`${Color.green('[OK]')} ${Color.cyan(APP_CONFIG_FILENAME)} synced from version ${version.name} (#${version.version}).`);
    this.log();
  }
}
