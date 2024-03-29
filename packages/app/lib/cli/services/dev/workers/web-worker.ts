import { type Cli, Color, System, Worker } from '@youcan/cli-kit';
import type { App, Web } from '@/types';

export default class WebWorker extends Worker.Abstract {
  private logger: Worker.Logger;

  public constructor(
    private command: Cli.Command,
    private app: App,
    private web: Web,
  ) {
    super();

    this.logger = new Worker.Logger('stderr', this.web.config.name || 'web', Color.blue);
  }

  public async boot(): Promise<void> {
  }

  public async run(): Promise<void> {
    const [cmd, ...args] = this.web.config.commands.dev.split(' ');

    return System.exec(cmd, args, {
      stdout: this.logger,
      signal: this.command.controller.signal,
      stderr: new Worker.Logger('stderr', this.web.config.name || 'web', Color.red),
    });
  }
}
