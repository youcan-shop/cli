import { Cli, Session } from '@youcan/cli-kit';

export default class Login extends Cli.Command {
  static description = 'Log in to a YouCan Dev Store';

  public async run(): Promise<void> {
    const session = await Session.authenticate(this);

    this.output.info(`Logged in as ${session.slug}`);
  }
}
