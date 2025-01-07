import { Filesystem, Http, Path, System, Worker } from '@youcan/cli-kit';
import { Server } from 'socket.io';
import debounce from 'debounce';
import { execute } from './execute';
import type { ThemeCommand } from '@/util/theme-command';
import type { Store, Theme } from '@/types';
import { THEME_FILE_TYPES } from '@/constants';

export default class ThemeWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private previewLogger: Worker.Logger;

  private queue: Array<() => Promise<any>> = [];
  private io!: Server;

  public constructor(
    private command: ThemeCommand,
    private store: Store,
    private theme: Theme,
  ) {
    super();

    this.logger = new Worker.Logger('themes', 'magenta');
    this.previewLogger = new Worker.Logger('preview', 'dim');
  }

  async boot(): Promise<void> {
    try {
      this.io = new Server(7565, {
        cors: {
          origin: `${Http.scheme()}://${this.store.domain}`,
          methods: ['GET', 'POST'],
        },
      });

      this.io.on('connection', (socket) => {
        this.previewLogger.write(`attached to preview page at ${socket.handshake.address}`);
      });

      System.open(`${Http.scheme()}://${this.store.domain}/themes/${this.theme.theme_id}/preview`);
    }
    catch (err) {
      this.command.error(err as Error);
    }
  }

  async run(): Promise<void> {
    const directories = THEME_FILE_TYPES.map(t => Path.resolve(this.theme.root, t));

    const watcher = Filesystem.watch(directories, {
      awaitWriteFinish: { stabilityThreshold: 50 },
      ignoreInitial: true,
      persistent: true,
      depth: 0,
    });

    this.command.controller.signal.addEventListener('abort', () => {
      watcher.close();
    });

    watcher.on('all', async (event, path) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }

      const [filetype, filename] = [
        Path.basename(Path.dirname(path)) as typeof THEME_FILE_TYPES[number],
        Path.basename(path),
      ];

      switch (event) {
        case 'add':
        case 'change':
          this.enqueue('save', filetype, filename);

          break;
        case 'unlink':
          this.enqueue('delete', filetype, filename);

          break;
      }
    });

    this.logger.write('Listening for changes...');

    // quick racing conditions hack
    setInterval(async () => {
      const task = this.queue.shift();
      if (task == null) {
        return;
      }

      await task();
    }, 10);
  }

  private enqueue(op: 'save' | 'delete', type: typeof THEME_FILE_TYPES[number], name: string): void {
    this.queue.push(async () => {
      await this.execute(op, type, name);

      debounce(() => {
        this.io.emit('theme:update');
        this.previewLogger.write('reloading preview...');
      }, 100)();
    });
  }

  private async execute(op: 'save' | 'delete', type: typeof THEME_FILE_TYPES[number], name: string): Promise<void> {
    return execute(this.theme, op, type, name, this.logger);
  }
}
