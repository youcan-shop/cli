import type { ThemeInfo } from '@/types';
import { ThemeCommand } from '@/util/theme-command';
import { Env, Http, Session } from '@youcan/cli-kit';

const formatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

export default class List extends ThemeCommand {
  static description = 'List remote development themes';

  async run() {
    await Session.authenticate(this);

    const { dev: themes } = await Http.get<{ dev: ThemeInfo[] }>(`${Env.apiHostname()}/themes`);

    if (!themes.length) {
      return this.output.info('You have no remote dev themes');
    }

    this.output.table(
      themes.map(t => ({
        id: t.id,
        name: t.name,
        version: t.version,
        size: formatter.format(t.size),
      })),
      {
        id: { header: 'Identifier' },
        name: { header: 'Name' },
        version: { header: 'Version' },
        size: { header: 'Size' },
      },
    );
  }
}
