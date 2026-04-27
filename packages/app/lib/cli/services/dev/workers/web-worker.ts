import type { App, Web } from '@/types';
import { getAppEnvironmentVariables } from '@/cli/services/environment-variables';
import { APP_CONFIG_FILENAME } from '@/constants';
import { type Cli, Filesystem, Path, type Services, System, Worker } from '@youcan/cli-kit';

export default class WebWorker extends Worker.Abstract {
  private logger: Worker.Logger;

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

    await Filesystem.writeJsonFile(
      Path.join(this.app.root, APP_CONFIG_FILENAME),
      this.app.config,
    );
  }

  public async run(): Promise<void> {
    const env = {
      ...getAppEnvironmentVariables(this.app),
      APP_URL: this.app.network_config!.app_url,
      PORT: this.app.network_config!.app_port.toString(),
    };

    const [cmd, ...args] = this.web.config.commands.dev.split(' ');

    return System.exec(cmd, args, {
      stdout: this.logger,
      signal: this.command.controller.signal,
      stderr: new Worker.Logger(this.web.config.name || 'web', 'red'),
      env,
    });
  }

  public async cleanup(): Promise<void> {
    this.logger.write('stopping web server...');

    if (this.app.network_config) {
      try {
        if (!await System.isPortAvailable(this.app.network_config.app_port)) {
          await System.killPortProcess(this.app.network_config.app_port);
          this.logger.write(`killed process on port ${this.app.network_config.app_port}`);
        }
      }
      catch {
        // ignore errors when killing port process
      }
    }
  }
}
