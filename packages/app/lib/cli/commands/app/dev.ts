import type { Worker } from '@youcan/cli-kit';
import { Env, Filesystem, Http, Path, Session, System, Tasks, UI } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import { load } from '@/util/app-loader';
import { APP_CONFIG_FILENAME } from '@/constants';
import { bootAppWorker, bootExtensionWorker, bootWebWorker } from '@/cli/services/dev/workers';
import { App } from '@/types';

interface Context {
  cmd: Dev
  workers: Worker.Interface[]
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';
  private app!: App;
  private session!: Session.StoreSession;

  async run(): Promise<any> {
    this.session = await Session.authenticate(this);
    this.app = await load();

    const { workers } = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Syncing app configuration..',
        task: async () => {
          await this.syncAppConfig()
        },
      },
      {
        title: 'Preparing dev processes...',
        task: async (ctx) => {
          ctx.workers = await this.prePareDevProcesses();
        },
      },
    ]);

    const hotKeys = [
      {
        keyboardKey: 'p',
        description: 'preview in your dev store',
        handler: async () => {
          const { url } = await Http.get<{ url: string }>(`${Env.apiHostname()}/apps/${this.app.config.id}/authorization-url`);
          System.open(url);
        },
      },
      {
        keyboardKey: 'q',
        description: 'quit',
        handler: () => this.exit(0),
      },
    ];

    UI.renderDevOutput({
      hotKeys,
      cmd: this,
    });

    this.runWorkers(workers);
  }

  async startDev() {
    this.app = await load();

    await this.syncAppConfig();
    const workers = await this.prePareDevProcesses();

    this.runWorkers(workers);
  }

  private runWorkers(workers: Worker.Interface[]) {
    Promise.all(workers.map(async worker => await worker.run()));
  }

  private async syncAppConfig(): Promise<void> {
    const endpoint = this.app.config.id == null
    ? `${Env.apiHostname()}/apps/create`
    : `${Env.apiHostname()}/apps/${this.app.config.id}/update`;

    const res = await Http.post<Record<string, any>>(endpoint, {
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
  }

  private async prePareDevProcesses(): Promise<Worker.Interface[]> {
    const promises: Promise<Worker.Interface>[] = [
      bootAppWorker(this, this.app),
    ];

    this.app.webs.forEach(web => promises.unshift(bootWebWorker(this, this.app, web)));
    this.app.extensions.forEach(ext => promises.unshift(bootExtensionWorker(this, this.app, ext)));
    return Promise.all(promises);
  }
}

export default Dev;
