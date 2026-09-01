import { THEME_CONFIG_FILENAME } from '@/constants';
import { THEME_FLAGS } from '@/flags';
import { ThemeCommand } from '@/util/theme-command';
import { Args, Flags } from '@oclif/core';
import { Cli, Env, Filesystem, Form, Git, Http, Path, Session, Tasks } from '@youcan/cli-kit';

class Init extends ThemeCommand {
  static description = 'Clones a theme template git repo';

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
      default: 'https://github.com/youcan-shop/origins',
    }),
    inplace: Flags.boolean({
      char: 'i',
      default: false,
      env: 'YC_FLAG_INPLACE',
      description: 'Initialize the current directory as a dev theme instead of cloning',
    }),
  };

  async run(): Promise<any> {
    const { flags } = await this.parse(Init);

    const session = await Session.authenticate(this);

    const answers = await (prompt(this));
    const dest = Path.join(flags.path, flags.inplace ? '' : answers.theme_name);

    await Tasks.run(
      {
        payload: answers,
        theme_id: null as string | null,
        cmd: this,
      },
      [
        {
          title: `Cloning ${flags.url} into ${dest}...`,
          skip: () => flags.inplace,
          task: async () => {
            await Git.clone({ url: flags.url, destination: dest });
          },
        },
        {
          title: 'Initializing development theme...',
          task: async (ctx) => {
            const path = await Filesystem.archived(dest, answers.theme_name);

            const configPath = Path.join(
              Path.cwd(),
              THEME_CONFIG_FILENAME,
            );

            if (flags.inplace && await Filesystem.exists(configPath)) {
              throw new Error(`
                This directory is already linked to a remote theme,
                please delete youcan.app.json if you wish to create a new one
              `);
            }

            Object.assign(ctx.payload, { archive: await Form.file(path) });

            const res = await Http.post<{ id: string }>(`${Env.apiHostname()}/themes/init`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: Form.convert(ctx.payload),
            });

            ctx.theme_id = res.id;

            await Filesystem.unlink(path);
          },
        },
        {
          title: 'Cleaning up...',
          task: async (ctx) => {
            await Filesystem.writeJsonFile(
              Path.join(dest, THEME_CONFIG_FILENAME),
              { theme_id: ctx.theme_id as string },
            );

            ctx.cmd.output.info(`\nDevelopment theme '${ctx.theme_id}' initiated!`);
          },
        },
      ],
    );
  }
}

async function prompt(command: ThemeCommand) {
  return command.prompt([
    {
      name: 'theme_name',
      type: 'text',
      initial: 'Starter',
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
    {
      type: 'text',
      name: 'theme_tutorial_url',
      message: 'A video tutorial URL for this theme.',
      initial: 'https://www.youtube.com/@Youcandotshop',
    },
  ]);
}

export default Init;
