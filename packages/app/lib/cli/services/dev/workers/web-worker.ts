import type { App, Web } from '@/types';
import process from 'node:process';
import { type Cli, type Services, System, Worker } from '@youcan/cli-kit';
import { getAppEnvironmentVariables } from '@/cli/services/environment-variables';

export default class WebWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private child?: ReturnType<typeof System.spawn>;

  public constructor(
    private readonly command: Cli.Command,
    private readonly app: App,
    private readonly web: Web,
    private readonly tunnelService?: Services.Cloudflared,
  ) {
    super();

    this.logger = new Worker.Logger(this.web.config.name || 'web', 'blue');
  }

  public async boot(): Promise<void> {
    const port = await System.getPortOrNextOrRandom(3000);

    this.app.network_config = {
      app_port: port,
      app_url: `http://localhost:${port}`,
    };

    if (this.tunnelService) {
      await this.tunnelService.tunnel(port, 'localhost', this.command.controller.signal);

      this.logger.write('start tunneling the app');

      let attempts = 0;
      while (attempts <= 28) {
        const url = this.tunnelService.getUrl();
        if (url) {
          this.app.network_config.app_url = url;
          this.logger.write(`tunneled url obtained: \`${url}\``);

          await System.sleep(2);
          break;
        }

        attempts++;
        await System.sleep(0.5);
      }

      if (!this.tunnelService.getUrl()) {
        this.logger.write('could not establish a tunnel, using localhost instead');
      }
    }

    const appUrl = this.app.network_config.app_url;

    this.app.config = {
      ...this.app.config,
      app_url: appUrl,
      redirect_urls: this.app.config.redirect_urls?.length > 0
        ? this.app.config.redirect_urls.map(r => new URL(new URL(r).pathname, appUrl).toString())
        : [new URL('/auth/callback', appUrl).toString()],
    };
  }

  public async run(): Promise<void> {
    const env = {
      ...getAppEnvironmentVariables(this.app),
      APP_URL: this.app.network_config!.app_url,
      PORT: this.app.network_config!.app_port.toString(),
    };

    const [cmd, ...args] = this.web.config.commands.dev.split(' ');

    const child = System.spawn(cmd, args, {
      env,
      detached: process.platform !== 'win32',
      stdout: this.logger,
      stderr: new Worker.Logger(this.web.config.name || 'web', 'red'),
    });

    this.child = child;

    const signal = this.command.controller.signal;
    signal.addEventListener('abort', () => {
      System.killTree(child);
      setTimeout(() => System.killTree(child, 'SIGKILL'), 800).unref();
    });

    process.once('exit', () => System.killTree(child, 'SIGKILL'));

    try {
      await child;
    }
    catch (err) {
      if (signal.aborted || child.killed) {
        return;
      }

      throw err;
    }
  }

  public async cleanup(): Promise<void> {
    this.logger.write('stopping web server...');

    if (this.child) {
      System.killTree(this.child);
    }

    const port = this.app.network_config?.app_port;
    if (!port) {
      return;
    }

    try {
      await System.waitUntilPortFree(port, 3000);
    }
    catch {
      await System.killPortProcess(port).catch(() => {});
      this.logger.write(`killed process on port ${port}`);
    }
  }
}
