import { Env, Filesystem, Http, Path, Session, Tasks } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import { load } from '@/util/app-loader';
import { APP_CONFIG_FILENAME } from '@/constants';
import { bootExtensionWorker } from '@/cli/services/dev/workers';

class Dev extends AppCommand {
  async run(): Promise<any> {
    const app = await load();
    const session = await Session.authenticate(this);

    await Tasks.run({ cmd: this }, [
      {
        title: 'Creating draft app..',
        skip() {
          return app.config.id != null;
        },
        async task() {
          const res = await Http.post<Record<string, any>>(`${Env.apiHostname()}/apps/draft/create`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ name: app.config.name }),
          });

          app.config = {
            name: res.name,
            id: res.id,
            url: res.url,
            oauth: {
              scopes: res.scopes,
              client_id: res.client_id,
            },
          };

          await Filesystem.writeJsonFile(
            Path.join(app.root, APP_CONFIG_FILENAME),
            app.config,
          );
        },
      },
      {
        title: 'Preparing dev workers..',
        async task(ctx) {
          const promises = app.extensions.map(async ext => await bootExtensionWorker(ctx.cmd, app, ext));
          const workers = await Promise.all(promises);

          console.log(workers);
        },
      },
    ]);
  }
}

export default Dev;
