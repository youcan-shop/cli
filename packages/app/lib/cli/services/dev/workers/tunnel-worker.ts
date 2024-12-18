import { Writable } from 'stream';
import type { Cli } from '@youcan/cli-kit';
import { System, Worker } from '@youcan/cli-kit';
import type { App } from '@/types';

export interface ExecutableType {
  command: string
  args: string[]
}

export default class TunnelWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private outputBuffer = '';

  constructor(
    private command: Cli.Command,
    private app: App,
    private executable: ExecutableType,
  ) {
    super();

    this.logger = new Worker.Logger('tunnel', 'cyan');
  }

  public async boot(): Promise<void> {}

  public async run(): Promise<void> {
    this.logger.write('tunneling the connection...');

    return System.exec(this.executable.command, this.executable.args, {
      signal: this.command.controller.signal,
      stdout: new Writable({ write: () => {} }),
      stderr: new Writable({
        write: (chunk) => {
          if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
            return false;
          }

          this.outputBuffer += chunk.toString();
        },
      }),
    });
  }
}
