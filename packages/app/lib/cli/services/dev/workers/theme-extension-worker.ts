import type { Cli } from '@youcan/cli-kit';
import { Env, Http, Session } from '@youcan/cli-kit';
import type { App, Extension } from '@/types';

export default class ThemeExtensionWorker {
  private constructor(
    private command: Cli.Command,
    private app: App,
    private extension: Extension,
  ) {}

  public static async boot(command: Cli.Command, app: App, extension: Extension): Promise<ThemeExtensionWorker> {
    const session = await Session.authenticate(command);

    try {
      const res = await Http.post(
        `${Env.apiHostname()}/apps/draft/${app.config.id}/extensions/create`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ ...extension.config }),
        },
      );

      console.log(res);
    }
    catch (err) {
      console.error(err);
    }

    return new ThemeExtensionWorker(command, app, extension);
  }

  public async run() {
  }
}
