import { System, Worker } from '@youcan/cli-kit';

import type { Services } from '@youcan/cli-kit';
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
    if (!this.app.network_config) {
      throw new Error('app network config is not set');
    }

    this.logger.write('start tunneling the app');

    await this.tunnelService.tunnel(this.app.network_config.app_port);

    let attempts = 0;

    while (!this.url && attempts <= 28) {
      const url = this.tunnelService.getUrl();

      if (url) {
        this.url = url;
        this.app.network_config!.app_url = this.url;
        this.logger.write(`tunneled url obtained: \`${url}\``);
      }
      
      await System.sleep(0.5)
    }

    if (!this.url) {
      this.logger.write('could not establish a tunnel, using localhost instead')
    }
  }

  public async run(): Promise<void> {
    setInterval(() => this.checkForError, 500);
  }

  private checkForError() {
    const error = this.tunnelService.getError();

    if (error) {
      throw new Error(`tunnel stopped: ${error}`);
    }
  }

  public getUrl(): string {
    if (!this.url) {
      throw new Error('app url not set')
    }

    return this.url;
  }
}
