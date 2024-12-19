import { Writable } from 'stream';
import type { Cli } from '@youcan/cli-kit';
import { Services, System, Worker } from '@youcan/cli-kit';
import type { App } from '@/types';

export interface ExecutableType {
  bin: string
  args: string[]
}

export default class TunnelWorker extends Worker.Abstract {
  private readonly logger: Worker.Logger;
  private buffer = '';

  constructor(
    private command: Cli.Command,
    private app: App,
    private executable: ExecutableType,
  ) {
    super();

    this.logger = new Worker.Logger('tunnel', 'cyan');
  }

  public async boot(): Promise<void> {
    // Start the tunnel ahead of time
    this.startTunnel();
  }

  public async run(): Promise<void> {
    this.logger.write('tunneling the connection...');
    return ;
  }
  
  public async startTunnel() {
    System.exec(this.executable.bin, this.executable.args, {
      signal: this.command.controller.signal,
      stderr: new Writable({
        write: (chunk: unknown, _encoding, next) => {
          if (!(chunk instanceof Buffer) && typeof chunk !== 'string') {
            return false;
          }
          this.buffer += chunk.toString();
          next();
        },
      }),
    });
  }
}
