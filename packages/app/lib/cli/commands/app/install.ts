import { AppCommand } from '@/util/app-command';
import { load } from '@/util/app-loader';
import { Env, Http, Session, System, Tasks } from '@youcan/cli-kit';

export default class Install extends AppCommand {
  static description = 'Generate an app installation URL';

  async run() {
    const app = await load();

    if (!app.config.id) {
      this.output.error('Please run the `dev` command before installing your app.');
    }

    await Session.authenticate(this);

    const { url } = await Tasks.run(
      { } as { url?: string },
      [
        {
          title: 'Building authorization url',
          async task(ctx) {
            const { url } = await Http.get<{ url: string }>(`${Env.apiHostname()}/apps/${app.config.id}/authorization-url`);

            ctx.url = url;
          },
        },
      ],
    );

    await this.output.anykey('Press any key to open the installation page in your browser');

    System.open(url!);
  }
}
