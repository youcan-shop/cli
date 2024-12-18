import { System, Worker } from '@youcan/cli-kit';
import type { App } from '@/types';
import type DevCommand from '@/cli/commands/app/dev';

export type ExecutableType = {
    command: string,
    args: string[]
}

export default class TunnelWorker extends Worker.Abstract {
  private logger: Worker.Logger;

  constructor(
    private command: DevCommand,
    private app: App,
    private executable: ExecutableType
  ) {
    super();

    this.logger = new Worker.Logger('tunnel', 'cyan');
  }

  public async boot(): Promise<void> {}

  public async run(): Promise<void> {
    this.logger.write('tunneling the connection...');

    return System.exec(this.executable.command, this.executable.args, {
      signal: this.command.controller.signal,
      stderr: new Worker.Logger('tunnel', 'red'),
    });
  }
}
