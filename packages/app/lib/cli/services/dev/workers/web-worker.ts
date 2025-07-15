import type { App, Web } from '@/types';
import { type Cli, System, Worker } from '@youcan/cli-kit';

export default class WebWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private processPort?: number;

  public constructor(
    private readonly command: Cli.Command,
    private readonly app: App,
    private readonly web: Web,
    private readonly env: Record<string, string>,
  ) {
    super();

    this.logger = new Worker.Logger(this.web.config.name || 'web', 'blue');
    this.processPort = this.env.PORT ? Number.parseInt(this.env.PORT, 10) : undefined;
  }

  public async boot(): Promise<void> {
  }

  public async run(): Promise<void> {
    const [cmd, ...args] = this.web.config.commands.dev.split(' ');

    return System.exec(cmd, args, {
      stdout: this.logger,
      signal: this.command.controller.signal,
      stderr: new Worker.Logger(this.web.config.name || 'web', 'red'),
      env: this.env,
    });
  }

  public async cleanup(): Promise<void> {
    this.logger.write('stopping web server...');

    if (this.processPort) {
      try {
        if (!await System.isPortAvailable(this.processPort)) {
          await System.killPortProcess(this.processPort);
          this.logger.write(`killed process on port ${this.processPort}`);
        }
      }
      catch (error) {
        // Ignore errors when killing port process
      }
    }
  }
}
