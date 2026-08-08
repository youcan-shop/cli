import type { AppConfig, RemoteAppConfig, RemoteAppSummary } from '@/types';
import { Args, Flags } from '@oclif/core';
import { Color, Env, Filesystem, Http, Path, Session } from '@youcan/cli-kit';
import { APP_CONFIG_FILENAME, appConfigFilename } from '@/constants';
import { AppCommand } from '@/util/app-command';

export default class ConfigLink extends AppCommand {
  static description = 'Create a config file linked to a remote app';

  static args = {
    env: Args.string({ required: true, description: 'Environment name, writes youcan.app.<env>.json' }),
  };

  static flags = {
    app: Flags.string({ description: 'App id or handle, prompts when omitted' }),
  };

  async run() {
    const { args, flags } = await this.parse(ConfigLink);

    if (!/^[a-z0-9-]+$/.test(args.env)) {
      this.output.error('Environment names may only contain lowercase letters, digits, and dashes.');
    }

    this.session = await Session.authenticate(this);

    const key = flags.app ?? await this.promptForApp();
    const remote = await Http.get<RemoteAppConfig>(`${Env.apiHostname()}/apps/${key}`);

    const filename = appConfigFilename(args.env);

    const base = await Filesystem
      .readJsonFile<Partial<AppConfig>>(Path.resolve(Path.cwd(), APP_CONFIG_FILENAME))
      .catch(() => ({} as Partial<AppConfig>));

    await Filesystem.writeJsonFile(Path.resolve(Path.cwd(), filename), {
      name: remote.name,
      id: remote.id,
      handle: remote.handle,
      app_url: remote.app_url,
      redirect_urls: remote.redirect_urls,
      webhooks: base.webhooks ?? [],
      oauth: {
        scopes: remote.scopes,
        client_id: remote.client_id,
      },
    });

    this.log();
    this.log(`${Color.green('[OK]')} ${Color.cyan(filename)} linked to ${remote.name} (${remote.id}).`);
    this.log(`     Use it with ${Color.cyan(`--config ${args.env}`)} on dev, deploy, release, and versions.`);
    this.log();
  }

  private async promptForApp(): Promise<string> {
    const { apps } = await Http.get<{ apps: RemoteAppSummary[] }>(`${Env.apiHostname()}/apps`);

    if (!apps.length) {
      this.output.error('You have no apps yet, run `youcan app dev` to create one.');
    }

    const response = await this.prompt({
      type: 'select',
      name: 'app',
      message: 'Which app should this config point at?',
      choices: apps.map(app => ({ title: `${app.name} (${app.handle})`, value: app.id })),
    });

    return response.app;
  }
}
