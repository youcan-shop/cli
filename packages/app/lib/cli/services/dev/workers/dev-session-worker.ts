import type { Cli } from '@youcan/cli-kit';
import type { App, Manifest, ManifestFile } from '@/types';
import { Env, Filesystem, Http, Worker } from '@youcan/cli-kit';
import { buildManifest } from '@/cli/services/deploy/manifest';
import { uploadMissingBlobs } from '@/cli/services/deploy/upload';
import { ensureExtensionIds } from '@/cli/services/extensions';

const DEBOUNCE_MS = 200;
const REFRESH_MS = 15 * 60 * 1000;

const formatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

function size(bytes: number): string {
  return formatter.format(bytes);
}

export default class DevSessionWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private watcher?: ReturnType<typeof Filesystem.watch>;
  private timer?: ReturnType<typeof setTimeout>;
  private refresher?: ReturnType<typeof setInterval>;
  private syncing = false;
  private dirty = false;
  private files: Map<string, ManifestFile> | null = null;

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

      this.logDiff(manifest);
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

  private logDiff(manifest: Manifest): void {
    const current = new Map<string, ManifestFile>();

    for (const extension of manifest.extensions) {
      for (const file of extension.files) {
        current.set(`${extension.handle}/${file.type}/${file.name}.${file.extension}`, file);
      }
    }

    const previous = this.files;
    this.files = current;

    if (previous === null) {
      for (const [path, file] of current) {
        this.logger.write(`[pushed] ${path} (${size(file.size)})`);
      }

      return;
    }

    for (const [path, file] of current) {
      const before = previous.get(path);

      if (!before) {
        this.logger.write(`[added] ${path} (${size(file.size)})`);
      }
      else if (before.hash !== file.hash) {
        this.logger.write(`[updated] ${path} (${size(before.size)} -> ${size(file.size)})`);
      }
    }

    for (const path of previous.keys()) {
      if (!current.has(path)) {
        this.logger.write(`[removed] ${path}`);
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
