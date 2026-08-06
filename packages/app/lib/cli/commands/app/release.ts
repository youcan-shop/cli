import type { AppVersion } from '@/types';
import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { Flags } from '@oclif/core';
import { Env, Http, Session } from '@youcan/cli-kit';

export default class Release extends AppCommand {
  static description = 'Release an existing app version';

  static flags = {
    version: Flags.integer({ description: 'Version number to release', required: true }),
  };

  async run() {
    const { flags } = await this.parse(Release);

    this.session = await Session.authenticate(this);
    this.app = await load();

    if (!this.app.config.id) {
      this.output.error('This app has no remote counterpart yet, run `youcan app dev` first.');
    }

    const version = await Http.post<AppVersion>(
      `${Env.apiHostname()}/apps/${this.app.config.id}/versions/${flags.version}/release`,
    );

    this.output.info(`Version ${version.name} (#${version.version}) released.`);
  }
}
