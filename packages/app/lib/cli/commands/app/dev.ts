import type { Organization } from '@/types';
import type { Cli, Worker } from '@youcan/cli-kit';
import process from 'node:process';
import { bootAppWorker, bootExtensionWorker, bootTunnelWorker, bootWebWorker } from '@/cli/services/dev/workers';
import { APP_CONFIG_FILENAME } from '@/constants';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { Env, Filesystem, Http, Path, Services, Session, System, Tasks, UI } from '@youcan/cli-kit';

interface Context {
  cmd: Dev;
  workers: Worker.Interface[];
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';
  private workers: Worker.Interface[] = [];

  constructor(argv: string[], config: any) {
    super(argv, config);

    this.setupExitHandlers();
  }

  private setupExitHandlers() {
    const cleanupAndExit = () => {
      try {
        if (this.controller) {
          this.controller.abort();
        }
        this.workers = [];

        console.log('Shutting down...');
        setTimeout(() => {
          process.exit(0);
        }, 100);
      }
      catch (error) {
        process.exit(0);
      }
    };

    process.once('SIGINT', cleanupAndExit);
    process.once('SIGTERM', cleanupAndExit);
    process.once('SIGQUIT', cleanupAndExit);

    process.once('exit', () => {
      if (this.controller) {
        this.controller.abort();
      }
    });
  }

  private readonly hotKeys = [
    {
      keyboardKey: 'p',
      description: 'preview in your dev store',
      handler: async () => this.openAppPreview(),
    },
    {
      keyboardKey: 'q',
      description: 'quit',
      handler: () => {
        try {
          if (this.controller) {
            this.controller.abort();
          }
          this.workers = [];
          console.log('Shutting down...');
          setTimeout(() => {
            process.exit(0);
          }, 100);
        }
        catch (error) {
          process.exit(0);
        }
      },
    },
  ];

  async run(): Promise<any> {
    this.session = await Session.authenticate(this);
    this.app = await load();

    let organizationId: string | null = null;

    if (!this.app.config.id) {
      organizationId = await this.selectOrganization();
    }

    const { workers } = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Preparing network options...',
        task: async (ctx) => {
          ctx.workers.push(await this.prepareNetworkOptions());
        },
      },
      {
        title: 'Syncing app configuration...',
        task: async () => { await this.syncAppConfig(organizationId); },
      },
      {
        title: 'Preparing dev processes...',
        task: async (ctx) => {
          ctx.workers.push(...await this.prepareDevProcesses());
        },
      },
    ]);

    UI.renderDevOutput({ hotKeys: this.hotKeys, cmd: this });

    this.runWorkers(workers);
  }

  private async prepareNetworkOptions() {
    const port = await System.getPortOrNextOrRandom(3000);

    this.app.network_config = {
      app_port: port,
      app_url: `http://localhost:${port}`,
    };

    const worker = await bootTunnelWorker(this, this.app, new Services.Cloudflared());

    this.app.config = {
      ...this.app.config,
      app_url: worker.getUrl(),
      redirect_urls: this.app.config.redirect_urls?.length > 0
        ? this.app.config.redirect_urls.map(r => new URL(new URL(r).pathname, worker.getUrl()).toString())
        : [new URL('/auth/callback', worker.getUrl()).toString()],
    };

    await Filesystem.writeJsonFile(
      Path.join(this.app.root, APP_CONFIG_FILENAME),
      this.app.config,
    );

    return worker;
  }

  async reloadWorkers() {
    this.controller = new AbortController();

    const networkConfig = this.app.network_config;
    this.app = await load();
    this.app.network_config = networkConfig;

    await this.syncAppConfig();

    await this.runWorkers(await this.prepareDevProcesses());
  }

  private async runWorkers(workers: Worker.Interface[]): Promise<void> {
    await Promise.all(workers.map(worker => worker.run())).catch((_) => { });
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
    if (!this.app.remote_config) {
      throw new Error('remote app config not loaded');
    }
    if (!this.app.network_config) {
      throw new Error('app network config is not set');
    }

    return {
      YOUCAN_API_KEY: this.app.remote_config.client_id,
      YOUCAN_API_SECRET: this.app.remote_config.client_secret,
      YOUCAN_API_SCOPES: this.app.remote_config.scopes.join(','),
      APP_URL: this.app.network_config.app_url,
      PORT: this.app.network_config.app_port.toString(),
    };
  }

  private async openAppPreview() {
    const endpointUrl = `${Env.apiHostname()}/apps/${this.app.config.id}/authorization-url`;
    const { url } = await Http.get<{ url: string }>(endpointUrl);

    System.open(url);
  }

  private async selectOrganization(): Promise<string> {
    const organizations = await Http.get<Organization[]>(`${Env.apiHostname()}/partners-organizations`, {
      headers: { Authorization: `Bearer ${this.session.access_token}` },
    });

    this.log('');

    const response: { organization: string } = await this.prompt.prompt([
      {
        type: 'select',
        name: 'organization',
        message: 'Which organization do you want to create the app in?',
        choices: organizations
          .map(organization => ({ title: organization.business_name, value: organization.short_id })),
      },
    ]);

    return response.organization;
  }
}

export default Dev;
