import type DevCommand from '@/cli/commands/app/dev';
import type { App } from '@/types';
import { APP_CONFIG_FILENAME } from '@/constants';
import { Filesystem, Path, Worker } from '@youcan/cli-kit';

export default class AppWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private watcher?: ReturnType<typeof Filesystem.watch>;

  constructor(
    private command: DevCommand,
    private app: App,
  ) {
    super();

    this.logger = new Worker.Logger('app', 'green');
  }

  public async boot(): Promise<void> {}

  public async run(): Promise<void> {
    await this.command.output.wait(500);
    this.logger.write('watching for config updates...');

    this.watcher = Filesystem.watch(Path.resolve(this.app.root, APP_CONFIG_FILENAME), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
      },
    });

    this.watcher.once('change', async () => {
      await this.watcher?.close();
      this.logger.write('config update detected, reloading workers...');
      this.command.controller.abort();

      this.command.reloadWorkers();
    });
  }

  public async cleanup(): Promise<void> {
    this.logger.write('stopping config watcher...');

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }
}
