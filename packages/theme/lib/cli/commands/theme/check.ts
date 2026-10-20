import { Env, Filesystem, Form, Http, Path, Session } from '@youcan/cli-kit';
import { THEME_FILE_TYPES, THEME_FOLDER_ALIASES } from '@/constants';
import { ThemeCommand } from '@/util/theme-command';

interface ThemeFileError {
  file: string;
  line: number | null;
  key: string | null;
  message: string;
  severity: 'error' | 'warning';
}

export default class Check extends ThemeCommand {
  static description = 'Check your theme for errors and warnings';

  async run() {
    await Session.authenticate(this);

    const root = Path.cwd();
    const path = await Filesystem.archived(root, `${Path.basename(root)}-check`, `{${[...THEME_FILE_TYPES, ...Object.keys(THEME_FOLDER_ALIASES)].join(',')}}/*`);

    try {
      const { errors } = await Http.post<{ errors: ThemeFileError[] }>(`${Env.apiHostname()}/themes/check`, {
        body: Form.convert({ archive: await Form.file(path) }),
      });

      for (const error of errors) {
        const location = [error.file, error.line].filter(part => part !== null).join(':');

        this.output.info(`${error.severity === 'error' ? '✖' : '⚠'} ${location}${error.key ? ` (${error.key})` : ''}: ${error.message}`);
      }

      const failed = errors.filter(error => error.severity === 'error').length;

      this.output.info(`\n${failed} error(s), ${errors.length - failed} warning(s)`);

      if (failed > 0) {
        this.exit(1);
      }
    }
    finally {
      await Filesystem.unlink(path);
    }
  }
}
