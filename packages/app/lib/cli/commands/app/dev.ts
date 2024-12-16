import type { Worker } from '@youcan/cli-kit';
import { Env, Filesystem, Http, Path, Session, System, Tasks, UI } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import { load } from '@/util/app-loader';
import { APP_CONFIG_FILENAME } from '@/constants';
import { bootAppWorker, bootExtensionWorker, bootWebWorker } from '@/cli/services/dev/workers';
import type { App, RemoteAppConfig } from '@/types';

interface Context {
  cmd: Dev
  workers: Worker.Interface[]
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';
  private app!: App;
  private session!: Session.StoreSession;

  private readonly hotKeys = [
    {
      keyboardKey: 'p',
      description: 'preview in your dev store',
      handler: async () => this.openAppPreview(),
    },
    {
      keyboardKey: 'q',
      description: 'quit',
      handler: () => this.exit(0),
    },
  ];

  async run(): Promise<any> {
    this.session = await Session.authenticate(this);
    this.app = await load();

    const { workers } = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Syncing app configuration..',
        task: async () => await this.syncAppConfig(),
      },
      {
        title: 'Preparing dev processes...',
        task: async (ctx) => {
          ctx.workers = await this.prepareDevProcesses();
        },
      },
    ]);

    UI.renderDevOutput({ hotKeys: this.hotKeys, cmd: this });

    this.runWorkers(workers);
  }

  async reloadWorkers() {
    this.controller = new AbortController();
    
    this.app = await load();
    await this.syncAppConfig();

    await this.runWorkers(
      await this.prepareDevProcesses(),
    );
  }

  private async runWorkers(workers: Worker.Interface[]): Promise<void> {
    await Promise.all(workers.map(worker => worker.run())).catch(_ => {});
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

    // mock
    res.client_secret = 'test-secret';

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

  private async prepareDevProcesses(): Promise<Worker.Interface[]> {
    const promises: Promise<Worker.Interface>[] = [
      bootAppWorker(this, this.app),
    ];

    this.app.webs.forEach(web => promises.unshift(
      bootWebWorker(
        this, 
        this.app,
        web,
        this.buildEnvVars()
      )
    ));

    this.app.extensions.forEach(ext => promises.unshift(bootExtensionWorker(this, this.app, ext)));

    return Promise.all(promises);
  }

  private buildEnvVars(): Record<string, string> {
    return {
      'YOUCAN_API_KEY': this.app.remoteConfig?.client_id!,
      'YOUCAN_API_SECRET': this.app.remoteConfig?.client_secret!,
      'APP_URL': 'localhost',
      'HOST': 'localhost',
      'PORT': '3000',
    };
  }

  private async openAppPreview() {
    const endpointUrl = `${Env.apiHostname()}/apps/${this.app.config.id}/authorization-url`;
    const { url } = await Http.get<{ url: string }>(endpointUrl);

    System.open(url);
  }
}

export default Dev;
