import { Env, Filesystem, Http, Path, Session, Tasks } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import type { AppConfig, InitialAppConfig } from '@/types';

class Dev extends AppCommand {
  async run(): Promise<any> {
    const session = await Session.authenticate(this);
    const path = Path.resolve(Path.cwd(), this.configFileName());

    await Tasks.run<{ config?: InitialAppConfig }>([
      {
        title: 'Loading app configuration..',
        async task(context, _) {
          context.config = await Filesystem.readJsonFile<InitialAppConfig>(path);
        },
      },
      {
        title: 'Creating draft app..',
        skip(ctx) {
          return ctx.config!.id != null;
        },
        async task(context, _) {
          context.config = await Http.post<AppConfig>(`${Env.apiHostname()}/apps/draft/create`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ name: context.config!.name }),
          });

          await Filesystem.writeJsonFile(path, context.config);
        },
      },
    ]);
  }
}

export default Dev;
