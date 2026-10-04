import type { Store, Theme } from '@/types';
import type { ThemeCommand } from '@/util/theme-command';
import { THEME_FILE_TYPES, THEME_FOLDER_ALIASES } from '@/constants';
import { Filesystem, Path, System, Worker } from '@youcan/cli-kit';
import debounce from 'debounce';
import { Server } from 'socket.io';
import { execute } from './execute';

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
          origin: `https://${this.store.domain}`,
          methods: ['GET', 'POST'],
        },
      });

      this.io.on('connection', (socket) => {
        this.previewLogger.write(`attached to preview page at ${socket.handshake.address}`);
      });

      System.open(`https://${this.store.domain}/themes/${this.theme.theme_id}/preview`);
    }
    catch (err) {
      this.command.error(err as Error);
    }
  }

  async run(): Promise<void> {
    const directories = [...THEME_FILE_TYPES, ...Object.keys(THEME_FOLDER_ALIASES)]
      .map(t => Path.resolve(this.theme.root, t));

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

      const folder = Path.basename(Path.dirname(path));
      const filetype = THEME_FOLDER_ALIASES[folder] ?? folder as typeof THEME_FILE_TYPES[number];
      const filename = Path.basename(path);

      switch (event) {
        case 'add':
        case 'change':
          this.enqueue('save', filetype, filename, folder);

          break;
        case 'unlink':
          this.enqueue('delete', filetype, filename, folder);

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

  private enqueue(op: 'save' | 'delete', type: typeof THEME_FILE_TYPES[number], name: string, folder: string): void {
    this.queue.push(async () => {
      await execute(this.theme, op, type, name, this.logger, folder);

      debounce(() => {
        this.io.emit('theme:update');
        this.previewLogger.write('reloading preview...');
      }, 100)();
    });
  }
}
