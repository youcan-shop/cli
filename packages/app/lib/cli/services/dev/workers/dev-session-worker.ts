import type { Cli } from '@youcan/cli-kit';
import type { App } from '@/types';
import { Env, Filesystem, Http, Path, Worker } from '@youcan/cli-kit';
import { buildManifest } from '@/cli/services/deploy/manifest';
import { uploadMissingBlobs } from '@/cli/services/deploy/upload';
import { ensureExtensionIds } from '@/cli/services/extensions';

const DEBOUNCE_MS = 200;
const REFRESH_MS = 15 * 60 * 1000;

export default class DevSessionWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private watcher?: ReturnType<typeof Filesystem.watch>;
  private timer?: ReturnType<typeof setTimeout>;
  private refresher?: ReturnType<typeof setInterval>;
  private syncing = false;
  private dirty = false;

  public constructor(
    private command: Cli.Command,
    private app: App,
  ) {
    super();

    this.logger = new Worker.Logger('extensions', 'yellow');
  }

  public async boot(): Promise<void> {
    await ensureExtensionIds(this.app);
  }

  public async run(): Promise<void> {
    await this.sync();

    const paths = this.app.extensions.map(e => e.root);

    this.watcher = Filesystem.watch(paths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
      },
    });

    this.watcher.on('all', () => this.schedule());
    this.refresher = setInterval(() => this.sync(), REFRESH_MS);

    this.command.controller.signal.addEventListener('abort', () => {
      this.watcher?.close();
    });
  }

  public async cleanup(): Promise<void> {
    this.logger.write('closing the dev session...');

    if (this.timer) {
      clearTimeout(this.timer);
    }

    if (this.refresher) {
      clearInterval(this.refresher);
    }

    await this.watcher?.close();
    this.watcher = undefined;

    await Http.del(`${Env.apiHostname()}/apps/${this.app.config.id}/dev-session`)
      .catch(() => {});
  }

  private schedule(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => this.sync(), DEBOUNCE_MS);
  }

  private async sync(): Promise<void> {
    if (this.syncing) {
      this.dirty = true;

      return;
    }

    this.syncing = true;

    try {
      const { manifest, blobs } = await buildManifest(this.app);

      await uploadMissingBlobs(this.app, blobs);

      await Http.put(`${Env.apiHostname()}/apps/${this.app.config.id}/dev-session`, {
        body: JSON.stringify({ manifest }),
      });

      this.logger.write('synced the dev session');
    }
    catch (err) {
      this.report(err as Error);
    }
    finally {
      this.syncing = false;

      if (this.dirty) {
        this.dirty = false;
        this.schedule();
      }
    }
  }

  private report(err: Error): void {
    try {
      const { errors } = JSON.parse(err.message) as { errors: Record<string, string[]> };

      for (const [path, messages] of Object.entries(errors)) {
        this.logger.write(`[invalid] ${path}: ${messages.join(', ')}`);
      }
    }
    catch {
      this.logger.write(`[error] ${err.message.split('\n')[0] ?? 'sync failed'}`);
    }
  }
}
