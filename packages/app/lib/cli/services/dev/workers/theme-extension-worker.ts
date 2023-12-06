import type { Cli } from '@youcan/cli-kit';
import { Color, Env, Filesystem, Form, Http, Path, Session } from '@youcan/cli-kit';
import type { App, Extension, ExtensionFileDescriptor, ExtensionMetadata, ExtensionWorker } from '@/types';

export default class ThemeExtensionWorker implements ExtensionWorker {
  public FILE_TYPES = [
    'assets',
    'locales',
    'snippets',
    'blocks',
  ];

  private EVENT_LOG_MAP = {
    error: () => Color.bold().red('[error]'),
    add: () => Color.bold().green('[created]'),
    change: () => Color.bold().blue('[updated]'),
    unlink: () => Color.bold().yellow('[deleted]'),
  };

  private formatter = Intl.NumberFormat('en', {
    unitDisplay: 'narrow',
    notation: 'compact',
    style: 'unit',
    unit: 'byte',
  });

  public constructor(
    private command: Cli.Command,
    private app: App,
    private extension: Extension,
  ) {}

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

      for (const type of Object.keys(this.extension.metadata!)) {
        // TODO: sync
      }
    }
    catch (err) {
      this.command.error(err as Error);
    }
  }

  public async run() {
    const paths = this.FILE_TYPES
      .map(p => Path.resolve(this.extension.root.toString(), p));

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

        const start = new Date().getTime();

        const [filetype, filename] = [
          Path.basename(Path.dirname(path)),
          Path.basename(path),
        ];

        let size = 0;

        switch (event) {
          case 'add':
          case 'change':
            size = (await this.file('put', filetype, filename)).size;

            break;
          case 'unlink':
            size = (await this.file('del', filetype, filename)).size;

            break;
        }

        this.log(
          event,
          Path.join(filetype, filename),
          this.formatter.format(size),
          new Date().getTime() - start,
        );
      }
      catch (err) {
        this.log('error', path);
        this.command.error(err as Error);
      }
    });
  }

  private async file(
    op: 'put' | 'del',
    type: typeof this.FILE_TYPES[number],
    name: string,
  ): Promise<ExtensionFileDescriptor> {
    const path = Path.resolve(this.extension.root.toString(), type, name);

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

  private log(event: string, path: string, size?: string, time?: number) {
    const tag = this.EVENT_LOG_MAP[event as keyof typeof this.EVENT_LOG_MAP]();

    let line = `${tag} ${Color.underline().white(path)}`;
    if (event !== 'error') {
      line += ` - ${size} | ${time}ms \n`;
    }

    this.command.log(`${tag} ${Color.underline().white(path)} - ${size} | ${time}ms \n`);
  }
}
