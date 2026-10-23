import { Cli, Session } from '@youcan/cli-kit';

export default class Login extends Cli.Command {
  static description = 'Log out from a YouCan Dev Store';

  public async run(): Promise<void> {
    await Session.logout();

    return this.output.info('Successfully logged out..');
  }
}
