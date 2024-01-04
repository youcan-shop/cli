import { Env, Http, Session, Tasks } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import { load } from '@/util/theme-loader';

interface Context {
  slug?: string
  domain?: string
}

export default class Dev extends ThemeCommand {
  async run() {
    const theme = await load();
    const session = await Session.authenticate(this);

    const context = await Tasks.run<Context>({}, [
      {
        title: 'Fetching theme info...',
        async task(ctx) {
          const res = await Http.get<{ domain: string; slug: string }>(
            `${Env.apiHostname()}/me`,
            { headers: { Authorization: `Bearer ${session.access_token}` } },
          );

          ctx.slug = res.slug;
          ctx.domain = res.domain;
        },
      },
    ]);
  }
}
