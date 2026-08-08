import type { AppVersion } from '@/types';
import { Env, Http, Session } from '@youcan/cli-kit';
import { AppCommand, configFlag } from '@/util/app-command';
import { load } from '@/util/app-loader';

export default class Versions extends AppCommand {
  static description = 'List the app versions';

  static flags = {
    ...configFlag,
  };

  async run() {
    const { flags } = await this.parse(Versions);

    this.session = await Session.authenticate(this);
    this.app = await load(flags.config);

    if (!this.app.config.id) {
      this.output.error('This app has no remote counterpart yet, run `youcan app dev` first.');
    }

    const { versions, active_version_id } = await Http.get<{
      versions: AppVersion[];
      active_version_id: string | null;
    }>(`${Env.apiHostname()}/apps/${this.app.config.id}/versions`);

    if (!versions.length) {
      return this.output.info('This app has no versions yet, run `youcan app deploy` to create one.');
    }

    this.output.table(
      versions.map(v => ({
        version: v.version,
        name: v.name ?? '',
        message: v.message ?? '',
        released: v.released_at ? new Date(v.released_at * 1000).toISOString().slice(0, 16) : '',
        active: v.id === active_version_id ? 'active' : '',
      })),
      {
        version: { header: '#' },
        name: { header: 'Name' },
        message: { header: 'Message' },
        released: { header: 'Released' },
        active: { header: '' },
      },
    );
  }
}
