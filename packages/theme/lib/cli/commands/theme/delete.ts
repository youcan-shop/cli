import { Env, Http, Session, Tasks } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import type { ThemeInfo } from '@/types';

export default class Delete extends ThemeCommand {
  static description = 'Select remote development themes to delete';

  async run() {
    await Session.authenticate(this);

    const { dev: themes } = await Http.get<{ dev: ThemeInfo[] }>(`${Env.apiHostname()}/themes`);

    if (!themes.length) {
      return this.output.info('You have no remote dev themes');
    }

    const choices = themes.map(t => ({ title: `${t.name} (${t.id})`, value: t.id }));

    const { identifiers } = await this.prompt({
      choices,
      type: 'multiselect',
      name: 'identifiers',
      message: 'Select themes to delete',
    });

    const tasks: Tasks.Task[] = identifiers.map((id: string) => {
      const theme = themes.find(t => t.id === id)!;

      return {
        title: `Deleting '${theme.name} (${theme.id})'...`,
        async task() {
          await Http.post(`${Env.apiHostname()}/themes/${theme.id}/delete`);
        },
      };
    });

    await Tasks.run({}, tasks);

    this.output.info(`Done! ${identifiers.length} themes deleted.`);
  }
}
