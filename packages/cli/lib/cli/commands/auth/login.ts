import { Cli, Session } from '@youcan/cli-kit';

export default class Login extends Cli.Command {
  public async run(): Promise<void> {
    const session = await Session.authenticate(this);

    this.output.info(`Logged in as ${session.slug}`);
  }
}
