import type { Cli } from '@youcan/cli-kit';
import { Color, Crypto, Env, Filesystem, Form, Http, Path, Session } from '@youcan/cli-kit';
import AbstractWorker, { WorkerLogger } from './abstract-worker';
import type { App, Extension, ExtensionFileDescriptor, ExtensionMetadata } from '@/types';

export default class ThemeExtensionWorker extends AbstractWorker {
  private logger: WorkerLogger;

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

    this.logger = new WorkerLogger('stdout', 'extensions', Color.yellow);
  }

  public async boot(): Promise<void> {
    const session = await Session.authenticate(this.command);

    try {
      const res = await Http.post<{ id: string; metadata: ExtensionMetadata }>(
        `${Env.apiHostname()}/apps/draft/${this.app.config.id}/extensions/create`,
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

    for (const type of Object.keys(this.extension.metadata!)) {
      const descriptors = this.extension.metadata![type];

      const directory = Path.resolve(this.extension.root, type);
      const present = await Filesystem.readdir(Path.resolve(directory));

      present.filter(f => !descriptors.find(d => d.file_name === f))
        .forEach(async file => await this.file('put', type, file));

      descriptors.forEach(async (descriptor) => {
        const path = Path.resolve(directory, descriptor.file_name);
        if (!(await Filesystem.exists(path))) {
          return await this.file('del', type, descriptor.file_name);
        }

        const buff = await Filesystem.readFile(path);
        if (Crypto.sha1(buff) !== descriptor.hash) {
          await this.file('put', type, descriptor.file_name);
        }
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
            await this.file('put', filetype, filename);

            break;
          case 'unlink':
            await this.file('del', filetype, filename);

            break;
        }
      }
      catch (err) {
        this.command.output.warn(err as Error);
      }
    });
  }

  private async file(
    op: 'put' | 'del',
    type: typeof this.FILE_TYPES[number],
    name: string,
  ): Promise<ExtensionFileDescriptor> {
    const path = Path.resolve(this.extension.root, type, name);

    this.logger.write(`- ${Path.join(type, name)}`);

    return await Http.post<ExtensionFileDescriptor>(
      `${Env.apiHostname()}/apps/draft/${this.app.config.id}/extensions/${this.extension.id!}/file`,
      {
        body: Form.convert({
          file_name: name,
          file_type: type,
          file_operation: op,
          file_content: await Form.file(path),
        }),
      },
    );
  }
}
