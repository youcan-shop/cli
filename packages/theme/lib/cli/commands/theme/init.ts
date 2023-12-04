import { Args, Flags } from '@oclif/core';
import { Cli, Env, Filesystem, Form, Git, Http, Path, Session, Tasks } from '@youcan/cli-kit';
import { ThemeCommand } from '@/util/theme-command';
import { THEME_FLAGS } from '@/flags';
import { THEME_CONFIG_FILENAME } from '@/constants';

class Init extends ThemeCommand {
  static description = 'Clones a theme template Git repo.';

  static args = {
    name: Args.string({
      name: 'name',
      required: false,
      description: 'A name for the new theme',
    }),
  };

  static flags = {
    ...Cli.commonFlags,
    ...THEME_FLAGS,
    url: Flags.string({
      char: 'u',
      env: 'YC_FLAG_CLONE_URL',
      description: 'The Git URL to clone from',
      default: 'https://github.com/youcan-shop/light-theme',
    }),
  };

  async run(): Promise<any> {
    const { flags } = await this.parse(Init);

    const session = await Session.authenticate(this);

    const answers = await (prompt(this));
    const dest = Path.join(flags.path, answers.theme_name);

    await Tasks.run(
      {
        payload: answers,
        theme_id: null as string | null,
        cmd: this,
      }, [
        {
          title: `Cloning ${flags.url} into ${dest}...`,
          task: async () => {
            await Git.clone({ url: flags.url, destination: dest });
          },
        },
        {
          title: 'Initializing development theme...',
          task: async (ctx) => {
            const path = await Filesystem.archived(Path.cwd(), answers.theme_name);
            Object.assign(ctx.payload, { archive: await Form.file(path) });

            const form = Form.convert(ctx.payload);
            const res = await Http.post<{ id: string }>(`${Env.apiHostname()}/themes/init`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: form,
            });

            ctx.theme_id = res.id;

            await Filesystem.unlink(path);
          },
        },
        {
          title: 'Cleaning up...',
          task: async (ctx) => {
            await Filesystem.writeJsonFile(
              Path.join(Path.cwd(), ctx.payload.theme_name, THEME_CONFIG_FILENAME),
              { theme_id: ctx.theme_id as string },
            );

            ctx.cmd.output.info(`\nDevelopment theme '${ctx.theme_id}' initiated!`);
          },
        },
      ]);
  }
}

async function prompt(command: ThemeCommand) {
  return command.prompt([
    {
      name: 'theme_name',
      type: 'text',
      initial: 'light-theme',
      message: 'Your theme\'s name',
      validate: (v: string) => {
        if (!v.length) {
          return 'Theme name cannot be empty';
        }

        if (v.length > 32) {
          return 'Theme name cannot exceed 32 characters';
        }

        return true;
      },
    },
    {
      type: 'text',
      name: 'theme_name',
      message: 'The theme\'s name, used for display purposes.',
      initial: 'Starter',
    },
    {
      type: 'text',
      name: 'theme_author',
      message: 'The theme\'s author',
      initial: 'YouCan',
    },
    {
      type: 'text',
      name: 'theme_version',
      message: 'The theme\'s current version',
      initial: '1.0.0',
    },
    {
      type: 'text',
      name: 'theme_support_url',
      message: 'A support URL for this theme.',
      initial: 'https://developer.youcan.shop',
    },
    {
      type: 'text',
      name: 'theme_documentation_url',
      message: 'A documentation URL for this theme.',
      initial: 'https://developer.youcan.shop',
    },
  ]);
}

export default Init;
