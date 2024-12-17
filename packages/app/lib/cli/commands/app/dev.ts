import type { Worker } from '@youcan/cli-kit';
import { Env, Http, Session, System, Tasks, UI } from '@youcan/cli-kit';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { bootAppWorker, bootExtensionWorker, bootWebWorker } from '@/cli/services/dev/workers';

interface Context {
  cmd: Dev
  workers: Worker.Interface[]
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';

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
        task: async () => { await this.syncAppConfig(); },
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
    await Promise.all(workers.map(worker => worker.run())).catch((_) => {});
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
        this.buildEnvironmentVariables(),
      ),
    ));

    this.app.extensions.forEach(ext => promises.unshift(bootExtensionWorker(this, this.app, ext)));

    return Promise.all(promises);
  }

  private buildEnvironmentVariables(): Record<string, string> {
    if (!this.app.remoteConfig) {
      throw new Error('remote app config not loaded');
    }

    return {
      YOUCAN_API_KEY: this.app.remoteConfig.client_id,
      YOUCAN_API_SECRET: this.app.remoteConfig.client_secret,
      YOUCAN_API_SCOPES: this.app.remoteConfig.scopes.join(','),
      APP_URL: 'http://localhost:3000',
      HOST: 'localhost',
      PORT: '3000',
    };
  }

  private async openAppPreview() {
    const endpointUrl = `${Env.apiHostname()}/apps/${this.app.config.id}/authorization-url`;
    const { url } = await Http.get<{ url: string }>(endpointUrl);

    System.open(url);
  }
}

export default Dev;
