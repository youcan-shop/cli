import { Color, Crypto, Env, Filesystem, Form, Http, Path, System, Worker } from '@youcan/cli-kit';
import { Server } from 'socket.io';
import debounce from 'debounce';
import type { FormDataResolvable } from '@youcan/cli-kit/dist/node/form';
import type { ThemeCommand } from '@/util/theme-command';
import type { FileDescriptor, Metadata, Store, Theme } from '@/types';

export default class ThemeWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private previewLogger: Worker.Logger;

  private queue: Array<() => Promise<any>> = [];
  private io!: Server;

  public FILE_TYPES: Array<keyof Metadata> = [
    'layouts',
    'sections',
    'locales',
    'assets',
    'snippets',
    'config',
    'templates',
  ];

  public constructor(
    private command: ThemeCommand,
    private store: Store,
    private theme: Theme,
  ) {
    super();

    this.logger = new Worker.Logger('stdout', 'themes', Color.magenta);
    this.previewLogger = new Worker.Logger('stdout', 'preview', Color.dim);
  }

  async boot(): Promise<void> {
    try {
      const res = await Http.get<Metadata>(`${Env.apiHostname()}/themes/${this.theme.theme_id}/metadata`);

      this.theme.metadata = res;

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
    this.logger.write(`pushing changes to ${this.theme.metadata!.theme_name}...`);

    for (const type of this.FILE_TYPES) {
      const descriptors = this.theme.metadata![type] as FileDescriptor[] ?? [];
      const directory = Path.resolve(this.theme.root, type);

      const present = await Filesystem.exists(directory)
        ? await Filesystem.readdir(directory)
        : [];

      if (type === 'config') {
        const order = ['settings_schema.json', 'settings_data.json'];
        descriptors.sort((a, b) => order.indexOf(a.file_name) - order.indexOf(b.file_name));
      }

      present.filter(f => !descriptors.find(d => d.file_name === f))
        .forEach(async file => this.enqueue('save', type, file));

      descriptors.forEach(async (descriptor) => {
        const path = Path.resolve(directory, descriptor.file_name);
        if (!(await Filesystem.exists(path))) {
          return this.enqueue('delete', type, descriptor.file_name);
        }

        const buffer = await Filesystem.readFile(path);
        const hash = Crypto.sha1(buffer);

        if (hash !== descriptor.hash) {
          this.enqueue('save', type, descriptor.file_name);
        }
      });
    }

    const directories = this.FILE_TYPES.map(t => Path.resolve(this.theme.root, t));

    const watcher = Filesystem.watch(directories, {
      awaitWriteFinish: { stabilityThreshold: 50 },
      ignoreInitial: true,
      persistent: true,
    });

    this.command.controller.signal.addEventListener('abort', () => {
      watcher.close();
    });

    watcher.on('all', async (event, path) => {
      if (!['add', 'change', 'unlink'].includes(event)) {
        return;
      }

      const [filetype, filename] = [
        Path.basename(Path.dirname(path)) as typeof this.FILE_TYPES[number],
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

    // quick racing conditions hack
    setInterval(async () => {
      const task = this.queue.shift();
      if (task == null) {
        return;
      }

      await task();
    }, 10);
  }

  private enqueue(op: 'save' | 'delete', type: typeof this.FILE_TYPES[number], name: string): void {
    this.queue.push(async () => {
      try {
        const path = Path.join(this.theme.root, type, name);

        const payload: Record<string, FormDataResolvable> = {
          file_name: name,
          file_type: type,
          file_operation: op,
        };

        if (op === 'save') {
          payload.file_content = await Form.file(path);
        }

        await Http.post(
        `${Env.apiHostname()}/themes/${this.theme.theme_id}/update`,
        {
          body: Form.convert(payload),
        },
        );

        this.logger.write(`[${op === 'save' ? 'updated' : 'deleted'}] - ${Path.join(type, name)}`);

        debounce(() => {
          this.io.emit('theme:update');
          this.previewLogger.write('reloading preview...');
        }, 100)();
      }
      catch (err) {
        if (err instanceof Error) {
          this.logger.write(`[error] - ${Path.join(type, name)}\n${err.message}`);
        }
      }
    });
  }
}
