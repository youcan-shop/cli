import type { Worker } from '@youcan/cli-kit';
import { Env, Filesystem, Http, Path, Session, System, Tasks, UI } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import { load } from '@/util/app-loader';
import { APP_CONFIG_FILENAME } from '@/constants';
import { bootAppWorker, bootExtensionWorker, bootWebWorker } from '@/cli/services/dev/workers';

interface Context {
  cmd: AppCommand
  workers: Worker.Interface[]
}

class Dev extends AppCommand {
  static description = 'Run the app in dev mode';

  async run(): Promise<any> {
    const app = await load();
    const session = await Session.authenticate(this);

    const { workers } = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Syncing app configuration..',
        async task() {
          const endpoint = app.config.id == null
            ? `${Env.apiHostname()}/apps/create`
            : `${Env.apiHostname()}/apps/${app.config.id}/update`;

          const res = await Http.post<Record<string, any>>(endpoint, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({
              name: app.config.name,
              app_url: app.config.app_url,
              redirect_urls: app.config.redirect_urls,
            }),
          });

          app.config = {
            name: res.name,
            id: res.id,
            app_url: res.app_url,
            redirect_urls: res.redirect_urls,
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
        title: 'Preparing dev processes...',
        async task(ctx) {
          const promises: Promise<Worker.Interface>[] = [
            bootAppWorker(ctx.cmd, app),
          ];

          app.webs.forEach(web => promises.unshift(bootWebWorker(ctx.cmd, app, web)));
          app.extensions.forEach(ext => promises.unshift(bootExtensionWorker(ctx.cmd, app, ext)));
          ctx.workers = await Promise.all(promises);
        },
      },
    ]);

    const hotKeys = [
      {
        keyboardKey: 'p',
        description: 'preview in your dev store',
        handler: async () => {
          const { url } = await Http.get<{ url: string }>(`${Env.apiHostname()}/apps/${app.config.id}/authorization-url`);
          System.open(url);
        },
      },
      {
        keyboardKey: 'q',
        description: 'quit',
        handler: () => this.exit(0),
      },
    ];

    UI.renderDevOutput({
      hotKeys,
      cmd: this,
    });

    await Promise.all(workers.map(async worker => await worker.run()));
  }
}

export default Dev;
