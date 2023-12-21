import { type Cli, Color, Filesystem, Path } from '@youcan/cli-kit';
import AbstractWorker, { WorkerLogger } from './abstract-worker';
import type { App } from '@/types';
import { APP_CONFIG_FILENAME } from '@/constants';

export default class AppWorker extends AbstractWorker {
  private logger: WorkerLogger;

  constructor(
    private command: Cli.Command,
    private app: App,
  ) {
    super();

    this.logger = new WorkerLogger('stdout', 'app', Color.cyan);
  }

  public async boot(): Promise<void> {

  }

  public async run(): Promise<void> {
    const watcher = Filesystem.watch(Path.resolve(this.app.root, APP_CONFIG_FILENAME), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
      },
    });

    watcher.on('change', async () => {
      watcher.close();
      this.command.controller.abort();

      this.logger.write('config update detected, reloading workers...');

      this.command.output.wait(2000);
      this.command.config.runCommand(this.command.id!, this.command.argv);
    });
  }
}
