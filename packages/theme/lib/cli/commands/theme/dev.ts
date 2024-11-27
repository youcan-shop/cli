import type { Worker } from '@youcan/cli-kit';
import { Crypto, Env, Filesystem, Http, Path, Session, Tasks, UI } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import { load } from '@/util/theme-loader';
import ThemeWorker from '@/cli/services/dev/worker';
import type { FileDescriptor, Metadata, Store } from '@/types';
import { execute } from '@/cli/services/dev/execute';
import { THEME_FILE_TYPES } from '@/constants';

interface Context {
  cmd: Dev
  store?: Store
  metadata?: Metadata
  workers: Worker.Interface[]
}

export default class Dev extends ThemeCommand {
  static description = 'Start a theme development server and preview your changes';

  async run() {
    const theme = await load();
    await Session.authenticate(this);

    const context = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Fetching theme metadata...',
        async task(ctx) {
          const store = await Http.get<{ domain: string; slug: string }>(`${Env.apiHostname()}/me`);

          ctx.store = {
            slug: store.slug,
            domain: store.domain,
          };

          const metadata = await Http.get<Metadata>(`${Env.apiHostname()}/themes/${theme.theme_id}/metadata`);
          theme.metadata = metadata;
        },
      },
      {
        title: 'Syncing theme files, please wait...',
        async task(ctx) {
          for (const type of THEME_FILE_TYPES) {
            const descriptors = theme.metadata![type] as FileDescriptor[] ?? [];
            const directory = Path.resolve(theme.root, type);

            const present = await Filesystem.exists(directory)
              ? await Filesystem.readdir(directory)
              : [];

            if (type === 'config') {
              const order = ['settings_schema.json', 'settings_data.json'];
              descriptors.sort((a, b) => order.indexOf(a.file_name) - order.indexOf(b.file_name));
            }

            for (const file of present.filter(f => !descriptors.find(d => d.file_name === f))) {
              const path = Path.resolve(directory, file);
              const isDir = await Filesystem.isDirectory(path);

              if (isDir) {
                continue;
              }

              await execute(theme, 'save', type, file);
            }

            for (const descriptor of descriptors) {
              const path = Path.resolve(directory, descriptor.file_name);
              if ((await Filesystem.isDirectory(path)) || !(await Filesystem.exists(path))) {
                return await execute(theme, 'delete', type, descriptor.file_name);
              }

              const buffer = await Filesystem.readFile(path);
              const hash = Crypto.sha1(buffer);

              if (hash !== descriptor.hash) {
                await execute(theme, 'save', type, descriptor.file_name);
              }
            }
          }
        },
      },
      {
        title: 'Preparing dev processes...',
        async task(ctx) {
          ctx.workers = [
            new ThemeWorker(ctx.cmd, ctx.store!, theme),
          ];

          await Promise.all(ctx.workers.map(async w => await w.boot()));
        },
      },
    ]);

    UI.renderDevOutput({
      hotKeys: [],
      cmd: this,
    });

    await Promise.all(context.workers.map(async w => await w.run()));
  }
}
