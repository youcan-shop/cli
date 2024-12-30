import type { Services } from '@youcan/cli-kit';
import { System, Worker } from '@youcan/cli-kit';
import type { App } from '@/types';
import type { AppCommand } from '@/util/app-command';

export default class TunnelWorker extends Worker.Abstract {
  private readonly logger: Worker.Logger;
  private url: string | null = null;

  constructor(
    private command: AppCommand,
    private app: App,
    private tunnelService: Services.Cloudflared,
  ) {
    super();

    this.logger = new Worker.Logger('tunnel', 'dim');
  }

  public async boot(): Promise<void> {
    if (!this.app.networkConfig) {
      throw new Error('app network config is not set');
    }

    this.logger.write('start tunneling the app');
    this.tunnelService.tunnel(this.app.networkConfig.port);

    // Stop the execution for while and see if the tunnel is available.
    await System.sleep(5);

    const url = this.tunnelService.getUrl();
    if (url) {
      this.logger.write(`tunneled url obtained: \`${url}\``);
      this.url = url;
      this.app.networkConfig!.appUrl = this.url;
    }
  }

  public async run(): Promise<void> {
    const timeInterval = 500;

    if (this.url) {
      return;
    }

    const intervalId = setInterval(() => {
      this.url = this.tunnelService.getUrl();
      if (this.url) {
        this.logger.write(`tunneled url obtained: \`${this.url}\``);
        this.app.networkConfig!.appUrl = this.url;

        this.command.syncAppConfig();

        clearTimeout(intervalId);
      }
    }, timeInterval);
  }
}
