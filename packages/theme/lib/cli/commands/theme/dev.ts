import type { Worker } from '@youcan/cli-kit';
import { Env, Http, Session, Tasks } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import { load } from '@/util/theme-loader';
import ThemeWorker from '@/cli/services/dev/worker';

interface Context {
  cmd: Dev
  slug?: string
  domain?: string
  workers: Worker.Interface[]
}

export default class Dev extends ThemeCommand {
  async run() {
    const theme = await load();
    await Session.authenticate(this);

    const context = await Tasks.run<Context>({ cmd: this, workers: [] }, [
      {
        title: 'Fetching theme info...',
        async task(ctx) {
          const res = await Http.get<{ domain: string; slug: string }>(`${Env.apiHostname()}/me`);

          ctx.slug = res.slug;
          ctx.domain = res.domain;
        },
      },
      {
        title: 'Preparing dev processes...',
        async task(ctx) {
          ctx.workers = [
            new ThemeWorker(ctx.cmd, theme),
          ];

          await Promise.all(ctx.workers.map(async w => await w.boot()));
        },
      },
    ]);

    await Promise.all(context.workers.map(async w => await w.run()));
  }
}
