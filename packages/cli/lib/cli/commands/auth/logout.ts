import { Cli, Config } from '@youcan/cli-kit';

export default class Login extends Cli.Command {
  static description = 'Log out from a YouCan Dev Store';

  public async run(): Promise<void> {
    Config
      .manager({ projectName: 'youcan-cli' })
      .delete('store_session');

    return this.output.info('Successfully logged out..');
  }
}
