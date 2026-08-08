import type { Worker } from '@youcan/cli-kit';
import process from 'node:process';
import { Flags } from '@oclif/core';
import { Env, Http, Services, Session, System, Tasks, UI } from '@youcan/cli-kit';
import { bootAppWorker, bootDevSessionWorker, bootWebWorker } from '@/cli/services/dev/workers';
import { AppCommand, configFlag } from '@/util/app-command';
import { load } from '@/util/app-loader';

interface Context {
  cmd: Dev;
  workers: Worker.Interface[];
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';

  static flags = {
    ...configFlag,
    'no-tunnel': Flags.boolean({
      description: 'Skip cloudflared tunnel and use localhost URL directly',
      default: false,
    }),
  };

  private workers: Worker.Interface[] = [];
  private configEnv?: string;
  private hasWebWorker = false;
  private useTunnel = false;
  private exiting = false;

  constructor(argv: string[], config: any) {
    super(argv, config);

    this.setupExitHandlers();
  }

  private async shutdown(): Promise<void> {
    if (this.exiting) {
      return;
    }

    this.exiting = true;

    try {
      console.log('Shutting down...');

      const cleanup = Promise.allSettled(this.workers.map(worker => worker.cleanup()));
      await Promise.race([cleanup, System.sleep(5)]);

      this.controller?.abort();
      this.workers = [];
    }
    finally {
      process.exit(0);
    }
  }

  private setupExitHandlers() {
    process.on('SIGINT', () => void this.shutdown());
    process.on('SIGTERM', () => void this.shutdown());
    process.on('SIGQUIT', () => void this.shutdown());
  }

  private get hotKeys() {
    return [
      {
        keyboardKey: 'p',
        description: this.hasWebWorker ? 'preview in your dev store' : 'open theme editor',
        handler: async () => this.openPreview(),
      },
      {
        keyboardKey: 'i',
        description: 'install app',
        handler: async () => this.openInstall(),
      },
      {
        keyboardKey: 'q',
        description: 'quit',
        handler: async () => this.shutdown(),
      },
    ];
  }

  async run(): Promise<any> {
    const { flags } = await this.parse(Dev);
    this.configEnv = flags.config;
    this.session = await Session.authenticate(this);
    this.app = await load(this.configEnv);

    this.hasWebWorker = this.app.webs.length > 0;
    this.useTunnel = this.hasWebWorker && !flags['no-tunnel'];

    const tasks = [];

    if (this.hasWebWorker) {
      tasks.push({
        title: this.useTunnel ? 'Preparing network options...' : 'Preparing network options (localhost)...',
        task: async (ctx: Context) => {
          ctx.workers.push(...await this.bootWebWorkers());
        },
      });
    }

    tasks.push(
      {
        title: 'Syncing app configuration...',
        task: async () => { await this.syncAppConfig(); },
      },
      {
        title: 'Preparing dev processes...',
        task: async (ctx: Context) => {
          ctx.workers.push(...await this.prepareDevProcesses());
        },
      },
    );

    const { workers } = await Tasks.run<Context>({ cmd: this, workers: [] }, tasks);

    UI.renderDevOutput({ hotKeys: this.hotKeys, cmd: this });

    this.runWorkers(workers);
  }

  async reloadWorkers() {
    this.controller = new AbortController();

    if (this.workers.length > 0) {
      await Promise.allSettled(this.workers.map(worker => worker.cleanup()));
      this.workers = [];
    }

    this.app = await load(this.configEnv);

    const webWorkers = this.hasWebWorker ? await this.bootWebWorkers() : [];

    await this.syncAppConfig();

    const devWorkers = await this.prepareDevProcesses();

    await this.runWorkers([...webWorkers, ...devWorkers]);
  }

  private async bootWebWorkers(): Promise<Worker.Interface[]> {
    return Promise.all(
      this.app.webs.map(web =>
        bootWebWorker(this, this.app, web, this.useTunnel ? new Services.Cloudflared() : undefined),
      ),
    );
  }

  private async runWorkers(workers: Worker.Interface[]): Promise<void> {
    this.workers = workers;

    await Promise.all(workers.map(worker => worker.run())).catch((_) => { });
  }

  private async prepareDevProcesses(): Promise<Worker.Interface[]> {
    return Promise.all([
      bootDevSessionWorker(this, this.app),
      bootAppWorker(this, this.app),
    ]);
  }

  private openPreview() {
    if (this.hasWebWorker) {
      System.open(`https://${Env.sellerAreaHostname()}/admin/apps/${this.app.config.id}/app`);
      return;
    }

    System.open(`https://${Env.sellerAreaHostname()}/admin/themes`);
  }

  private async openInstall() {
    const endpointUrl = `${Env.apiHostname()}/apps/${this.app.config.id}/authorization-url`;
    const { url } = await Http.get<{ url: string }>(endpointUrl);

    System.open(url);
  }
}

export default Dev;
