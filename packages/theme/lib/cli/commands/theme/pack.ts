import type { Metadata } from '@/types';
import { ThemeCommand } from '@/util/theme-command';
import { load } from '@/util/theme-loader';
import { Filesystem, Path, Session, Tasks } from '@youcan/cli-kit';

const formatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

const FILE_TYPES: Array<keyof Metadata> = [
  'layouts',
  'sections',
  'locales',
  'assets',
  'snippets',
  'config',
  'templates',
];

export function date() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

interface Context {
  path?: string;
}

export default class Pack extends ThemeCommand {
  static description = 'Pack your theme into an archive to upload or share';

  async run() {
    await Session.authenticate(this);
    const theme = await load();

    const context = await Tasks.run<Context>({}, [
      {
        title: 'Packing your theme...',
        async task(ctx) {
          const name = `${Path.basename(theme.root)}-${date()}`;

          ctx.path = await Filesystem.archived(theme.root, name, `{${FILE_TYPES.join(',')}}/*`);
        },
      },
    ]);

    const { size } = await Filesystem.stat(context.path!);
    this.output.info(`Theme successfully packed into ${Path.basename(context.path!)} (${formatter.format(size)})`);
  }
}
