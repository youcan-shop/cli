import type { Cli } from '@youcan/cli-kit';
import { Env, Filesystem, Form, Http, Path, Session, Worker } from '@youcan/cli-kit';
import type { App, Extension, ExtensionFileDescriptor, ExtensionMetadata } from '@/types';

export default class ThemeExtensionWorker extends Worker.Abstract {
  private logger: Worker.Logger;
  private queue: Array<() => Promise<any>> = [];

  public FILE_TYPES = [
    'assets',
    'locales',
    'snippets',
    'blocks',
  ];

  public constructor(
    private command: Cli.Command,
    private app: App,
    private extension: Extension,
  ) {
    super();

    this.logger = new Worker.Logger('extensions', 'yellow');
  }

  public async boot(): Promise<void> {
    const session = await Session.authenticate(this.command);

    try {
      const res = await Http.post<{ id: string; metadata: ExtensionMetadata }>(
        `${Env.apiHostname()}/apps/${this.app.config.id}/extensions/create`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ ...this.extension.config }),
        },
      );

      this.extension.id = res.id;
      this.extension.metadata = res.metadata;
    }
    catch (err) {
      this.command.error(err as Error);
    }
  }

  public async run() {
    this.logger.write(`pushed '${this.extension.config.name}' to a draft...`);

    for (const type of this.FILE_TYPES) {
      const descriptors = this.extension.metadata![type] ?? [];

      const directory = Path.resolve(this.extension.root, type);
      const present = await Filesystem.exists(directory)
        ? await Filesystem.readdir(directory)
        : [];

      present.filter(f => !descriptors.find(d => d.file_name === f))
        .forEach(async file => this.enqueue('put', type, file));

      descriptors.forEach(async (descriptor) => {
        const path = Path.resolve(directory, descriptor.file_name);
        if (!(await Filesystem.exists(path))) {
          return this.enqueue('del', type, descriptor.file_name);
        }

        this.enqueue('put', type, descriptor.file_name);
      });
    }

    const paths = this.FILE_TYPES
      .map(p => Path.resolve(this.extension.root, p));

    const watcher = Filesystem.watch(paths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 50,
      },
    });

    this.command.controller.signal.addEventListener('abort', () => {
      watcher.close();
    });

    watcher.on('all', async (event, path) => {
      try {
        if (!['add', 'change', 'unlink'].includes(event)) {
          return;
        }

        const [filetype, filename] = [
          Path.basename(Path.dirname(path)),
          Path.basename(path),
        ];

        switch (event) {
          case 'add':
          case 'change':
            this.enqueue('put', filetype, filename);

            break;
          case 'unlink':
            this.enqueue('del', filetype, filename);

            break;
        }
      }
      catch (err) {
        this.command.output.warn(err as Error);
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

  private enqueue(
    op: 'put' | 'del',
    type: typeof this.FILE_TYPES[number],
    name: string,
  ): void {
    this.queue.push(async () => {
      const path = Path.join(this.extension.root, type, name);

      const payload: Record<string, Form.FormDataResolvable> = {
        file_name: name,
        file_type: type,
        file_operation: op,
      };

      if (op === 'put') {
        payload.file_content = await Form.file(path);
      }

      await Http.post<ExtensionFileDescriptor>(
        `${Env.apiHostname()}/apps/${this.app.config.id}/extensions/${this.extension.id!}/file`,
        {
          body: Form.convert(payload),
        },
      );

      this.logger.write(`[${op === 'put' ? 'updated' : 'deleted'}] - ${Path.join(type, name)}`);
    });
  }
}
