import { type Cli, Color, System } from '@youcan/cli-kit';
import AbstractWorker, { WorkerLogger } from './abstract-worker';
import type { App, Web } from '@/types';

export default class WebWorker extends AbstractWorker {
  private logger: WorkerLogger;

  public constructor(
    private command: Cli.Command,
    private app: App,
    private web: Web,
  ) {
    super();

    this.logger = new WorkerLogger('stderr', this.web.config.name || 'web', Color.blue);
  }

  public async boot(): Promise<void> {
  }

  public async run(): Promise<void> {
    const [cmd, ...args] = this.web.config.commands.dev.split(' ');

    return System.exec(cmd, args, {
      stdout: this.logger,
      signal: this.command.controller.signal,
      stderr: new WorkerLogger('stderr', this.web.config.name || 'web', Color.red),
    });
  }
}
