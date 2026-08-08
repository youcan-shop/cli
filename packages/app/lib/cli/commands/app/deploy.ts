import type { AppVersion, Manifest } from '@/types';
import { Flags } from '@oclif/core';
import { Env, Http, Session } from '@youcan/cli-kit';
import { buildManifest } from '@/cli/services/deploy/manifest';
import { uploadMissingBlobs } from '@/cli/services/deploy/upload';
import { ensureExtensionIds } from '@/cli/services/extensions';
import { AppCommand, configFlag } from '@/util/app-command';
import { load } from '@/util/app-loader';

export default class Deploy extends AppCommand {
  static description = 'Create a new app version and release it';

  static flags = {
    ...configFlag,
    'message': Flags.string({ char: 'm', description: 'Version description' }),
    'version': Flags.string({ description: 'Version name, generated when omitted' }),
    'no-release': Flags.boolean({ description: 'Create the version without releasing it', default: false }),
    'force': Flags.boolean({ char: 'f', description: 'Skip safety prompts', default: false }),
  };

  async run() {
    const { flags } = await this.parse(Deploy);

    this.session = await Session.authenticate(this);
    this.app = await load(flags.config);

    if (!this.app.config.id) {
      this.output.error('This app has no remote counterpart yet, run `youcan app dev` first.');
    }

    if (!flags.force) {
      this.assertReleasableAppUrl();
    }

    await ensureExtensionIds(this.app);

    const { manifest, blobs } = await buildManifest(this.app);

    if (!flags.force) {
      await this.warnAboutRemovedBlocks(manifest);
    }

    const uploaded = await uploadMissingBlobs(this.app, blobs);
    this.output.info(`Uploaded ${uploaded} new file${uploaded === 1 ? '' : 's'}.`);

    try {
      const version = await Http.post<AppVersion>(`${Env.apiHostname()}/apps/${this.app.config.id}/versions`, {
        body: JSON.stringify({
          manifest,
          name: flags.version,
          message: flags.message,
          release: !flags['no-release'],
        }),
      });

      this.output.info(
        `Version ${version.name} (#${version.version}) ${flags['no-release'] ? 'created' : 'released'}.`,
      );
    }
    catch (err) {
      this.printValidationErrors(err as Error);
    }
  }

  private assertReleasableAppUrl(): void {
    const url = this.app.config.app_url;

    if (!url && this.app.webs.length) {
      this.output.error(
        'This app has no app_url, releasing would leave merchants without a working app. Set it in youcan.app.json or pass --force.',
      );
    }

    const tunnels = ['trycloudflare.com', 'ngrok-free.app', 'ngrok.io'];
    if (url && tunnels.some(host => url.includes(host))) {
      this.output.error(
        `The app url points at a dev tunnel (${url}), releasing would break the live app. Fix youcan.app.json or pass --force.`,
      );
    }
  }

  private async warnAboutRemovedBlocks(manifest: Manifest): Promise<void> {
    const active = await this.activeManifest();
    if (!active) {
      return;
    }

    const blocks = (m: Manifest) => m.extensions
      .flatMap(e => e.files.filter(f => f.type === 'blocks').map(f => `${e.handle}/${f.name}.${f.extension}`));

    const removed = blocks(active).filter(b => !blocks(manifest).includes(b));
    if (!removed.length) {
      return;
    }

    this.output.error(
      `These blocks exist in the released version but not locally, deploying orphans them on every store that placed them:\n`
      + `${removed.map(b => `  - ${b}`).join('\n')}\n`
      + `Pass --force to deploy anyway.`,
    );
  }

  private async activeManifest(): Promise<Manifest | null> {
    try {
      const active = await Http.get<AppVersion & { manifest: Manifest }>(
        `${Env.apiHostname()}/apps/${this.app.config.id}/versions/active`,
      );

      return active.manifest;
    }
    catch {
      return null;
    }
  }

  private printValidationErrors(err: Error): void {
    let errors: Record<string, string[]> | undefined;

    try {
      errors = (JSON.parse(err.message) as { errors?: Record<string, string[]> }).errors;
    }
    catch {
      throw err;
    }

    if (!errors) {
      throw err;
    }

    const lines = Object.entries(errors)
      .map(([path, messages]) => `  ${path}\n${messages.map(m => `    - ${m}`).join('\n')}`);

    this.output.error(`The manifest failed validation:\n${lines.join('\n')}`);
  }
}
